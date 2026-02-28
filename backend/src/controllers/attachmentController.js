import prisma from "../lib/prisma.js";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/entries/:entryId/attachments
// Save an attachment record (file is uploaded directly to Supabase from frontend)
// ─────────────────────────────────────────────────────────────────────────────
export const addAttachment = async (req, res) => {
  const { entryId } = req.params;
  const { url, fileType } = req.body;

  if (!url || !fileType) {
    return res.status(400).json({ message: "url and fileType are required." });
  }

  try {
    // Verify the entry belongs to the current user
    const entry = await prisma.journalEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      return res.status(404).json({ message: "Entry not found." });
    }
    if (entry.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied." });
    }

    const attachment = await prisma.entryAttachment.create({
      data: {
        url,
        fileType,
        entryId,
      },
    });

    return res.status(201).json({ message: "Attachment added.", attachment });
  } catch (error) {
    console.error("Add attachment error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/entries/:entryId/attachments
// List all attachments for an entry
// ─────────────────────────────────────────────────────────────────────────────
export const getAttachments = async (req, res) => {
  const { entryId } = req.params;

  try {
    const entry = await prisma.journalEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      return res.status(404).json({ message: "Entry not found." });
    }
    if (entry.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied." });
    }

    const attachments = await prisma.entryAttachment.findMany({
      where: { entryId },
      orderBy: { createdAt: "asc" },
    });

    return res.status(200).json({ attachments });
  } catch (error) {
    console.error("Get attachments error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/entries/:entryId/attachments/:attachmentId
// Delete a single attachment record
// ─────────────────────────────────────────────────────────────────────────────
export const deleteAttachment = async (req, res) => {
  const { entryId, attachmentId } = req.params;

  try {
    const entry = await prisma.journalEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      return res.status(404).json({ message: "Entry not found." });
    }
    if (entry.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied." });
    }

    const attachment = await prisma.entryAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment || attachment.entryId !== entryId) {
      return res.status(404).json({ message: "Attachment not found." });
    }

    await prisma.entryAttachment.delete({ where: { id: attachmentId } });

    return res.status(200).json({ message: "Attachment deleted." });
  } catch (error) {
    console.error("Delete attachment error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
