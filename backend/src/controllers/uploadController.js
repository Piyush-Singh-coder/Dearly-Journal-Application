import { createClient } from "@supabase/supabase-js";
import multer from "multer";

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Store file in memory as a Buffer (no disk writes needed)
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
});

// POST /api/upload
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided." });
    }

    const { folder = "uploads" } = req.body; // e.g. "avatars" or "covers"
    const ext = req.file.originalname.split(".").pop();
    const fileName = `${folder}/${req.user.id}-${Date.now()}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from("avatars") // single bucket, subfolders via fileName path
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return res.status(500).json({ message: error.message });
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("avatars").getPublicUrl(fileName);

    return res.status(200).json({ url: publicUrl });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ message: "Upload failed." });
  }
};
