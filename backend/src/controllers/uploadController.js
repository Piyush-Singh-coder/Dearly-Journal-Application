import multer from "multer";
import { uploadToS3, deleteFromS3 } from "../lib/s3.js";

// Store file in memory as a Buffer before S3 upload
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for images & audio
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("audio/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image and audio files are allowed"), false);
    }
  },
});

// POST /api/upload
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided." });
    }

    const { folder = "uploads" } = req.body;
    const ext = req.file.originalname ? req.file.originalname.split(".").pop() : "bin";
    const userId = req.user ? req.user.id : "anonymous";
    const objectKey = `${userId}/${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    const publicUrl = await uploadToS3(
      req.file.buffer,
      objectKey,
      req.file.mimetype
    );

    return res.status(200).json({
      url: publicUrl,
      fileType: req.file.mimetype,
      storagePath: objectKey,
    });
  } catch (err) {
    console.error("S3 Upload error:", err);
    return res.status(500).json({ message: err.message || "Upload to AWS S3 failed." });
  }
};

// DELETE /api/upload
export const deleteFile = async (req, res) => {
  try {
    const { storagePath } = req.body;
    if (!storagePath) {
      return res.status(400).json({ message: "storagePath is required" });
    }

    await deleteFromS3(storagePath);
    return res.status(200).json({ message: "File deleted successfully" });
  } catch (err) {
    console.error("S3 Delete error:", err);
    return res.status(500).json({ message: err.message || "Delete from S3 failed." });
  }
};
