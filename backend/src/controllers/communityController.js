import prisma from "../lib/prisma.js";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/community/share/:entryId
// Share an entry to the community feed — owner only
// ─────────────────────────────────────────────────────────────────────────────
export const shareToCommunity = async (req, res) => {
  const { entryId } = req.params;
  const { isAnonymous = true } = req.body;

  try {
    const entry = await prisma.journalEntry.findUnique({
      where: { id: entryId },
      include: { notebook: true },
    });

    if (!entry) {
      return res.status(404).json({ message: "Entry not found." });
    }
    if (entry.userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the owner can share this entry." });
    }

    // Update the entry shareMode and create/update the CommunityPost
    const [updatedEntry] = await prisma.$transaction([
      prisma.journalEntry.update({
        where: { id: entryId },
        data: { shareMode: "community", isAnonymous },
      }),
      prisma.communityPost.upsert({
        where: { entryId },
        update: { isAnonymous },
        create: {
          entryId,
          isAnonymous,
          notebookId: entry.notebookId, // Required by schema
        },
      }),
    ]);

    return res.status(200).json({
      message: "Entry shared to community feed successfully.",
      entry: updatedEntry,
    });
  } catch (error) {
    console.error("Share to community error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/community/share/:entryId
// Remove an entry from the community feed — owner only
// ─────────────────────────────────────────────────────────────────────────────
export const unshareFromCommunity = async (req, res) => {
  const { entryId } = req.params;

  try {
    const entry = await prisma.journalEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      return res.status(404).json({ message: "Entry not found." });
    }
    if (entry.userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the owner can unshare this entry." });
    }

    await prisma.$transaction([
      prisma.journalEntry.update({
        where: { id: entryId },
        data: { shareMode: "private", isAnonymous: false },
      }),
      prisma.communityPost.delete({
        where: { entryId },
      }),
    ]);

    return res
      .status(200)
      .json({ message: "Entry removed from community feed." });
  } catch (error) {
    if (error.code === "P2025") {
      // It wasn't in the community feed anyway, just update the entry if needed
      await prisma.journalEntry.update({
        where: { id: entryId },
        data: { shareMode: "private", isAnonymous: false },
      });
      return res
        .status(200)
        .json({ message: "Entry removed from community feed." });
    }
    console.error("Unshare from community error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/community/feed
// Get the public community feed
// ─────────────────────────────────────────────────────────────────────────────
export const getCommunityFeed = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  try {
    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          entry: {
            include: {
              tags: true,
              _count: { select: { reactions: true, comments: true } },
              // Include the user only if it isn't anonymous
              user: {
                select: { id: true, fullName: true, avatarUrl: true },
              },
            },
          },
        },
      }),
      prisma.communityPost.count(),
    ]);

    // Strip user data from frontend response if the post is anonymous
    const cleanedPosts = posts.map((post) => {
      if (post.isAnonymous && post.entry) {
        post.entry.user = null; // Hide author details completely
      }
      return post;
    });

    return res.status(200).json({
      posts: cleanedPosts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get community feed error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/community/reaction/:entryId
// Add or change a reaction to a community entry
// ─────────────────────────────────────────────────────────────────────────────
export const handleReaction = async (req, res) => {
  const { entryId } = req.params;
  const { type } = req.body;

  const validTypes = ["support", "heart", "thoughtful"];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ message: "Invalid reaction type." });
  }

  try {
    const post = await prisma.communityPost.findUnique({ where: { entryId } });
    if (!post) {
      return res
        .status(404)
        .json({ message: "This entry is not in the community feed." });
    }

    // upsert handles both creating a new reaction or changing an existing one
    const reaction = await prisma.reaction.upsert({
      where: {
        userId_entryId: {
          userId: req.user.id,
          entryId,
        },
      },
      update: { type },
      create: { type, userId: req.user.id, entryId },
    });

    return res.status(200).json({ message: "Reaction recorded.", reaction });
  } catch (error) {
    console.error("Reaction error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/community/reaction/:entryId
// Remove a reaction
// ─────────────────────────────────────────────────────────────────────────────
export const removeReaction = async (req, res) => {
  const { entryId } = req.params;

  try {
    const result = await prisma.reaction.deleteMany({
      where: {
        userId: req.user.id,
        entryId,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ message: "Reaction not found." });
    }

    return res.status(200).json({ message: "Reaction removed." });
  } catch (error) {
    console.error("Remove reaction error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/community/comment/:entryId
// Add a comment to a community entry
// Implements business rules: must react first, 30m cooldown, daily limits
// ─────────────────────────────────────────────────────────────────────────────
export const addComment = async (req, res) => {
  const { entryId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: "Comment content is required." });
  }

  const DAILY_COMMENT_LIMIT = 5;
  const COOLDOWN_MINUTES = 30;

  try {
    const post = await prisma.communityPost.findUnique({ where: { entryId } });
    if (!post) {
      return res
        .status(404)
        .json({ message: "This entry is not in the community feed." });
    }

    // Load fresh user data directly (req.user might be stale on exact timestamps)
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    // 1. Rule: Must react before commenting
    const existingReaction = await prisma.reaction.findUnique({
      where: { userId_entryId: { userId: user.id, entryId } },
    });
    if (!existingReaction) {
      return res
        .status(403)
        .json({
          message: "You must react to this entry before you can comment.",
        });
    }

    // Reset daily tokens if a new day has started
    const now = new Date();
    const isNewDay =
      now.getDate() !== user.lastCommentResetDate.getDate() ||
      now.getMonth() !== user.lastCommentResetDate.getMonth() ||
      now.getFullYear() !== user.lastCommentResetDate.getFullYear();

    let tokensUsed = isNewDay ? 0 : user.commentTokensUsedToday;

    // 2. Rule: Daily token limit
    if (tokensUsed >= DAILY_COMMENT_LIMIT) {
      return res
        .status(429)
        .json({ message: "Daily comment limit reached. Try again tomorrow." });
    }

    // 3. Rule: Cooldown period
    const lastComment = await prisma.comment.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (lastComment) {
      const minutesSinceLast =
        (now.getTime() - lastComment.createdAt.getTime()) / (1000 * 60);
      if (minutesSinceLast < COOLDOWN_MINUTES) {
        const remainingStr = Math.ceil(COOLDOWN_MINUTES - minutesSinceLast);
        return res
          .status(429)
          .json({
            message: `Cooldown active. Please wait ${remainingStr} more minutes.`,
          });
      }
    }

    // Execute comment creation and token tracking atomically
    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: { content, userId: user.id, entryId },
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: {
          commentTokensUsedToday: tokensUsed + 1,
          lastCommentResetDate: isNewDay ? now : undefined,
        },
      }),
    ]);

    return res.status(201).json({ message: "Comment added.", comment });
  } catch (error) {
    console.error("Add comment error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/community/comments/:entryId
// Get comments for a community entry
// ─────────────────────────────────────────────────────────────────────────────
export const getComments = async (req, res) => {
  const { entryId } = req.params;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  try {
    const post = await prisma.communityPost.findUnique({ where: { entryId } });
    if (!post) {
      return res
        .status(404)
        .json({ message: "This entry is not in the community feed." });
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { entryId },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      }),
      prisma.comment.count({ where: { entryId } }),
    ]);

    return res.status(200).json({
      comments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get comments error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
