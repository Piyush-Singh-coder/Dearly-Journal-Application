import prisma from "../lib/prisma.js";
import crypto from "crypto";
import { sendInviteEmail } from "../lib/mailer.js";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/notebooks
// Create a new notebook (personal or team)
// ─────────────────────────────────────────────────────────────────────────────
export const createNotebook = async (req, res) => {
  const { title, description, coverImage, type } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Title is required." });
  }

  const validTypes = ["personal", "team"];
  if (type && !validTypes.includes(type)) {
    return res
      .status(400)
      .json({ message: "Invalid type. Must be: personal or team." });
  }

  try {
    // For team journals, generate a shareable invite code
    const inviteCode =
      type === "team" ? crypto.randomBytes(8).toString("hex") : null;

    const notebook = await prisma.notebook.create({
      data: {
        title,
        description: description || null,
        coverImage: coverImage || null,
        type: type || "personal",
        inviteCode,
        userId: req.user.id,
        // Owner is auto-added as a JournalMember with role "owner"
        members: {
          create: { userId: req.user.id, role: "owner" },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: { select: { entries: true } },
      },
    });

    return res.status(201).json({ message: "Notebook created.", notebook });
  } catch (error) {
    console.error("Create notebook error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/notebooks
// List all notebooks the user owns or is a member of
// ─────────────────────────────────────────────────────────────────────────────
export const getNotebooks = async (req, res) => {
  try {
    const notebooks = await prisma.notebook.findMany({
      where: {
        OR: [
          { userId: req.user.id },
          { members: { some: { userId: req.user.id } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { entries: true, members: true } },
        members: {
          where: { userId: req.user.id },
          select: { role: true },
        },
      },
    });

    return res.status(200).json({ notebooks });
  } catch (error) {
    console.error("Get notebooks error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/notebooks/:id
// Get a single notebook with its members and recent entries
// ─────────────────────────────────────────────────────────────────────────────
export const getNotebookById = async (req, res) => {
  const { id } = req.params;

  try {
    const notebook = await prisma.notebook.findFirst({
      where: {
        id,
        OR: [
          { userId: req.user.id },
          { members: { some: { userId: req.user.id } } },
        ],
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        entries: {
          orderBy: { date: "desc" },
          take: 10,
          select: {
            id: true,
            title: true,
            mood: true,
            date: true,
            shareMode: true,
            createdAt: true,
          },
        },
        _count: { select: { entries: true, members: true } },
      },
    });

    if (!notebook) {
      return res
        .status(404)
        .json({ message: "Notebook not found or access denied." });
    }

    return res.status(200).json({ notebook });
  } catch (error) {
    console.error("Get notebook by ID error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/notebooks/:id
// Update notebook — owner only
// ─────────────────────────────────────────────────────────────────────────────
export const updateNotebook = async (req, res) => {
  const { id } = req.params;
  const { title, description, coverImage } = req.body;

  try {
    const notebook = await prisma.notebook.findUnique({ where: { id } });

    if (!notebook) {
      return res.status(404).json({ message: "Notebook not found." });
    }
    if (notebook.userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the owner can update this notebook." });
    }

    const updated = await prisma.notebook.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(coverImage !== undefined && { coverImage }),
      },
    });

    return res
      .status(200)
      .json({ message: "Notebook updated.", notebook: updated });
  } catch (error) {
    console.error("Update notebook error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/notebooks/:id
// Delete notebook — owner only
// Cascades to entries, members, invites (via schema onDelete: Cascade)
// ─────────────────────────────────────────────────────────────────────────────
export const deleteNotebook = async (req, res) => {
  const { id } = req.params;

  try {
    const notebook = await prisma.notebook.findUnique({ where: { id } });

    if (!notebook) {
      return res.status(404).json({ message: "Notebook not found." });
    }
    if (notebook.userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the owner can delete this notebook." });
    }

    await prisma.notebook.delete({ where: { id } });

    return res.status(200).json({ message: "Notebook deleted." });
  } catch (error) {
    console.error("Delete notebook error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/notebooks/:id/invite
// Invite a collaborator by email — owner only
// ─────────────────────────────────────────────────────────────────────────────
export const inviteToNotebook = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const notebook = await prisma.notebook.findUnique({ where: { id } });

    if (!notebook) {
      return res.status(404).json({ message: "Notebook not found." });
    }
    if (notebook.userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the owner can invite members." });
    }
    if (notebook.type !== "team") {
      return res
        .status(400)
        .json({ message: "Only team journals support invitations." });
    }

    // Check if already a member
    const existingMember = await prisma.journalMember.findFirst({
      where: { notebookId: id, user: { email } },
    });
    if (existingMember) {
      return res
        .status(409)
        .json({ message: "This user is already a member." });
    }

    // Check for existing pending invite
    const existingInvite = await prisma.invite.findFirst({
      where: { notebookId: id, email, status: "pending" },
    });
    if (existingInvite) {
      return res
        .status(409)
        .json({ message: "An invitation is already pending for this email." });
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await prisma.invite.create({
      data: { email, notebookId: id, expiresAt },
    });

    // Send invite email (fire and forget)
    sendInviteEmail(email, notebook.title, invite.token, req.user).catch(
      (err) => console.error("Failed to send invite email:", err),
    );

    return res.status(201).json({
      message: `Invitation sent to ${email}.`,
      invite: {
        id: invite.id,
        email: invite.email,
        status: invite.status,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error) {
    console.error("Invite error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/notebooks/join/:token
// Accept an invite and join a team notebook
// ─────────────────────────────────────────────────────────────────────────────
export const joinByInvite = async (req, res) => {
  const { token } = req.params;

  try {
    // ── Path 1: Per-email invite (Invite table) ──────────────────────────────
    const invite = await prisma.invite.findUnique({
      where: { token },
      include: { notebook: true },
    });

    if (invite) {
      if (invite.status !== "pending") {
        return res
          .status(400)
          .json({
            message: "This invite has already been used or has expired.",
          });
      }
      if (new Date() > invite.expiresAt) {
        await prisma.invite.update({
          where: { token },
          data: { status: "expired" },
        });
        return res
          .status(400)
          .json({ message: "This invite link has expired." });
      }

      // Enforce that only the invited email can accept
      if (
        invite.email &&
        invite.email.trim().toLowerCase() !==
          req.user.email.trim().toLowerCase()
      ) {
        return res.status(403).json({
          message: "This invite was sent to a different email address.",
        });
      }

      // Check if already a member
      const existingMember = await prisma.journalMember.findUnique({
        where: {
          userId_notebookId: {
            userId: req.user.id,
            notebookId: invite.notebookId,
          },
        },
      });
      if (existingMember) {
        return res
          .status(409)
          .json({ message: "You are already a member of this notebook." });
      }

      // Add user as editor + mark invite accepted
      const [, member] = await prisma.$transaction([
        prisma.invite.update({
          where: { token },
          data: { status: "accepted" },
        }),
        prisma.journalMember.create({
          data: {
            userId: req.user.id,
            notebookId: invite.notebookId,
            role: "editor",
          },
        }),
      ]);

      return res.status(200).json({
        message: `You have joined "${invite.notebook.title}".`,
        notebook: invite.notebook,
        role: member.role,
      });
    }

    // ── Path 2: Notebook.inviteCode (open invite code) ───────────────────────
    const notebook = await prisma.notebook.findUnique({
      where: { inviteCode: token },
    });

    if (!notebook) {
      return res.status(400).json({ message: "Invalid invite code." });
    }
    if (notebook.type !== "team") {
      return res.status(400).json({ message: "This is not a team notebook." });
    }

    // Prevent owner from joining their own notebook
    if (notebook.userId === req.user.id) {
      return res
        .status(400)
        .json({ message: "You are the owner of this notebook." });
    }

    // Check if already a member
    const existing = await prisma.journalMember.findUnique({
      where: {
        userId_notebookId: { userId: req.user.id, notebookId: notebook.id },
      },
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: "You are already a member of this notebook." });
    }

    const member = await prisma.journalMember.create({
      data: { userId: req.user.id, notebookId: notebook.id, role: "editor" },
    });

    return res.status(200).json({
      message: `You have joined "${notebook.title}".`,
      notebook,
      role: member.role,
    });
  } catch (error) {
    console.error("Join by invite error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/notebooks/:id/members/:userId
// Remove a member — owner can remove anyone, members can remove themselves (leave)
// ─────────────────────────────────────────────────────────────────────────────
export const removeMember = async (req, res) => {
  const { id: notebookId, userId: targetUserId } = req.params;

  try {
    const notebook = await prisma.notebook.findUnique({
      where: { id: notebookId },
    });
    if (!notebook) {
      return res.status(404).json({ message: "Notebook not found." });
    }

    const isSelf = req.user.id === targetUserId;
    const isOwner = notebook.userId === req.user.id;

    if (!isSelf && !isOwner) {
      return res
        .status(403)
        .json({ message: "Only the owner can remove other members." });
    }
    if (targetUserId === notebook.userId) {
      return res.status(400).json({
        message:
          "The owner cannot be removed. Transfer ownership or delete the notebook.",
      });
    }

    const result = await prisma.journalMember.deleteMany({
      where: { userId: targetUserId, notebookId },
    });
    if (result.count === 0) {
      return res.status(404).json({ message: "Member not found." });
    }

    return res.status(200).json({
      message: isSelf ? "You have left the notebook." : "Member removed.",
    });
  } catch (error) {
    console.error("Remove member error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
