import prisma from "../lib/prisma.js";
import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/entries
// Create a new journal entry for the authenticated user
// ─────────────────────────────────────────────────────────────────────────────
export const createEntry = async (req, res) => {
  const {
    title,
    content,
    mood,
    date,
    notebookId,
    tagNames,
    shareMode,
    isAnonymous,
  } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required." });
  }

  const validShareModes = ["private", "link", "community"];
  if (shareMode && !validShareModes.includes(shareMode)) {
    return res
      .status(400)
      .json({
        message: "Invalid shareMode. Must be: private, link, or community.",
      });
  }

  try {
    // If linking to a notebook, verify it belongs to the current user (or they're a member)
    if (notebookId) {
      const notebook = await prisma.notebook.findFirst({
        where: {
          id: notebookId,
          OR: [
            { userId: req.user.id },
            {
              members: {
                some: {
                  userId: req.user.id,
                  role: { in: ["owner", "editor"] },
                },
              },
            },
          ],
        },
      });
      if (!notebook) {
        return res
          .status(403)
          .json({ message: "Notebook not found or access denied." });
      }
    }

    // Generate a share token if sharing via link
    const shareToken =
      shareMode === "link" ? crypto.randomBytes(16).toString("hex") : null;

    // Build tag connect-or-create array
    const tagOps = tagNames?.length
      ? {
          connectOrCreate: tagNames.map((name) => ({
            where: { name_userId: { name, userId: req.user.id } },
            create: { name, userId: req.user.id },
          })),
        }
      : undefined;

    const entry = await prisma.journalEntry.create({
      data: {
        title,
        content,
        mood: mood || null,
        date: date ? new Date(date) : new Date(),
        shareMode: shareMode || "private",
        shareToken,
        isAnonymous: isAnonymous || false,
        userId: req.user.id,
        notebookId: notebookId || null,
        tags: tagOps,
      },
      include: {
        tags: true,
        attachments: true,
        notebook: { select: { id: true, title: true } },
      },
    });

    return res
      .status(201)
      .json({ message: "Entry created successfully.", entry });
  } catch (error) {
    console.error("Create entry error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/entries
// List all entries for the authenticated user
// Supports: ?notebookId=, ?mood=, ?shareMode=, ?tag=, ?page=, ?limit=
// ─────────────────────────────────────────────────────────────────────────────
export const getEntries = async (req, res) => {
  const { notebookId, mood, shareMode, tag, page = 1, limit = 20 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const where = {
    userId: req.user.id,
    ...(notebookId && { notebookId }),
    ...(mood && { mood }),
    ...(shareMode && { shareMode }),
    ...(tag && { tags: { some: { name: tag } } }),
  };

  try {
    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take: Number(limit),
        include: {
          tags: true,
          notebook: { select: { id: true, title: true } },
          _count: {
            select: { reactions: true, comments: true, attachments: true },
          },
        },
      }),
      prisma.journalEntry.count({ where }),
    ]);

    return res.status(200).json({
      entries,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get entries error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/entries/:id
// Get a single entry by ID — owner only (or via public shareToken)
// ─────────────────────────────────────────────────────────────────────────────
export const getEntryById = async (req, res) => {
  const { id } = req.params;

  try {
    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        tags: true,
        attachments: true,
        notebook: { select: { id: true, title: true, type: true } },
        _count: { select: { reactions: true, comments: true } },
      },
    });

    if (!entry) {
      return res.status(404).json({ message: "Entry not found." });
    }

    // Only the owner (or notebook members) can access the full entry
    if (entry.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied." });
    }

    return res.status(200).json({ entry });
  } catch (error) {
    console.error("Get entry by ID error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/entries/:id
// Update a journal entry — owner only
// ─────────────────────────────────────────────────────────────────────────────
export const updateEntry = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    content,
    mood,
    date,
    notebookId,
    tagNames,
    shareMode,
    isAnonymous,
  } = req.body;

  const validShareModes = ["private", "link", "community"];
  if (shareMode && !validShareModes.includes(shareMode)) {
    return res
      .status(400)
      .json({
        message: "Invalid shareMode. Must be: private, link, or community.",
      });
  }

  try {
    const existing = await prisma.journalEntry.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ message: "Entry not found." });
    }
    if (existing.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied." });
    }

    // Generate share token if switching to "link" mode for the first time
    let shareToken = existing.shareToken;
    if (shareMode === "link" && !shareToken) {
      shareToken = crypto.randomBytes(16).toString("hex");
    } else if (shareMode === "private") {
      shareToken = null; // revoke link access
    }

    // Rebuild tags: replace all existing tags with new list
    const tagOps =
      tagNames !== undefined
        ? {
            set: [], // first disconnect all current tags
            connectOrCreate: tagNames.map((name) => ({
              where: { name_userId: { name, userId: req.user.id } },
              create: { name, userId: req.user.id },
            })),
          }
        : undefined;

    const updated = await prisma.journalEntry.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(mood !== undefined && { mood }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(notebookId !== undefined && { notebookId }),
        ...(shareMode !== undefined && { shareMode }),
        ...(isAnonymous !== undefined && { isAnonymous }),
        shareToken,
        ...(tagOps && { tags: tagOps }),
      },
      include: {
        tags: true,
        attachments: true,
        notebook: { select: { id: true, title: true } },
      },
    });

    return res
      .status(200)
      .json({ message: "Entry updated successfully.", entry: updated });
  } catch (error) {
    console.error("Update entry error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/entries/:id
// Delete a journal entry — owner only
// ─────────────────────────────────────────────────────────────────────────────
export const deleteEntry = async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await prisma.journalEntry.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ message: "Entry not found." });
    }
    if (existing.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied." });
    }

    await prisma.journalEntry.delete({ where: { id } });

    return res.status(200).json({ message: "Entry deleted successfully." });
  } catch (error) {
    console.error("Delete entry error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
