import express from "express";
import { uploadFile, upload } from "../controllers/uploadController.js";
import { protect } from "../middleware/protect.js";

const router = express.Router();

// POST /api/upload — requires auth, accepts a single "file" field
router.post("/", protect, upload.single("file"), uploadFile);

export default router;
