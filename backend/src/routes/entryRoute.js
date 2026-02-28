import express from "express";
import {
  createEntry,
  getEntries,
  getEntryById,
  updateEntry,
  deleteEntry,
  duplicateEntry,
  getEntryByShareToken,
} from "../controllers/entryController.js";
import {
  addAttachment,
  getAttachments,
  deleteAttachment,
} from "../controllers/attachmentController.js";
import { protect } from "../middleware/protect.js";

const router = express.Router();

// ─── PUBLIC (no auth) ───────────────────────────────────────────────────────
// Must be before protect middleware
router.get("/share/:token", getEntryByShareToken); // GET /api/entries/share/:token

// All remaining entry routes require authentication
router.use(protect);

router.post("/", createEntry); // POST   /api/entries
router.get("/", getEntries); // GET    /api/entries
router.get("/:id", getEntryById); // GET    /api/entries/:id
router.put("/:id", updateEntry); // PUT    /api/entries/:id
router.delete("/:id", deleteEntry); // DELETE /api/entries/:id
router.post("/:id/duplicate", duplicateEntry); // POST   /api/entries/:id/duplicate

// Attachments
router.post("/:entryId/attachments", addAttachment); // POST   /api/entries/:entryId/attachments
router.get("/:entryId/attachments", getAttachments); // GET    /api/entries/:entryId/attachments
router.delete("/:entryId/attachments/:attachmentId", deleteAttachment); // DELETE /api/entries/:entryId/attachments/:attachmentId

export default router;
