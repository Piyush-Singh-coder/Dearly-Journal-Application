import express from "express";
import { uploadFile, deleteFile, upload } from "../controllers/uploadController.js";
import { protect } from "../middleware/protect.js";

const router = express.Router();

// POST /api/upload — requires auth, accepts a single "file" field
router.post("/", protect, upload.single("file"), uploadFile);

// DELETE /api/upload — requires auth, accepts storagePath in body
router.delete("/", protect, deleteFile);

export default router;
