import express from "express";
import {
  createEntry,
  getEntries,
  getEntryById,
  updateEntry,
  deleteEntry,
} from "../controllers/entryController.js";
import { protect } from "../middleware/protect.js";

const router = express.Router();

// All entry routes require authentication
router.use(protect);

router.post("/", createEntry); // POST   /api/entries
router.get("/", getEntries); // GET    /api/entries
router.get("/:id", getEntryById); // GET    /api/entries/:id
router.put("/:id", updateEntry); // PUT    /api/entries/:id
router.delete("/:id", deleteEntry); // DELETE /api/entries/:id

export default router;
