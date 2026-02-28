import { supabase } from "./supabase";

const BUCKET_NAME = "journal-attachments";

/**
 * Upload a file to Supabase Storage.
 * @param {File} file - The file object (image, audio, etc.)
 * @param {string} userId - The current user's ID (used as a folder prefix)
 * @param {string} [folder="entries"] - Optional sub-folder within the user directory
 * @returns {Promise<{url: string, fileType: string}>} The public URL and MIME type
 */
export async function uploadFile(file, userId, folder = "entries") {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${userId}/${folder}/${timestamp}_${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    console.error("Supabase upload error:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  return {
    url: publicUrl,
    fileType: file.type,
    storagePath: filePath,
  };
}

/**
 * Delete a file from Supabase Storage by its path.
 * @param {string} storagePath - The full storage path (e.g. "userId/entries/123_photo.jpg")
 * @returns {Promise<void>}
 */
export async function deleteFile(storagePath) {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storagePath]);

  if (error) {
    console.error("Supabase delete error:", error);
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Upload multiple files at once.
 * @param {File[]} files
 * @param {string} userId
 * @param {string} [folder="entries"]
 * @returns {Promise<Array<{url: string, fileType: string, storagePath: string}>>}
 */
export async function uploadMultipleFiles(files, userId, folder = "entries") {
  const results = await Promise.all(
    files.map((file) => uploadFile(file, userId, folder)),
  );
  return results;
}

/**
 * Helper: Determine if a file is an image or audio based on MIME type.
 * @param {string} mimeType
 * @returns {"image" | "audio" | "other"}
 */
export function getFileCategory(mimeType) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  return "other";
}

/**
 * Accepted file types for the journal entry editor.
 */
export const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/gif,image/webp";
export const ACCEPTED_AUDIO_TYPES =
  "audio/mpeg,audio/wav,audio/ogg,audio/webm,audio/mp4";
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Validate a file before uploading.
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateFile(file) {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `File exceeds ${MAX_FILE_SIZE_MB}MB limit.` };
  }

  const category = getFileCategory(file.type);
  if (category === "other") {
    return {
      valid: false,
      error: "Only images and audio files are supported.",
    };
  }

  return { valid: true };
}
