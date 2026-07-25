import { axiosInstance } from "../store/authStore";

/**
 * Upload a file to AWS S3 via the Node.js backend.
 * @param {File} file - The file object (image, audio, etc.)
 * @param {string} userId - The current user's ID
 * @param {string} [folder="entries"] - Optional folder within user directory
 * @returns {Promise<{url: string, fileType: string, storagePath: string}>}
 */
export async function uploadFile(file, userId, folder = "entries") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await axiosInstance.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return {
    url: response.data.url,
    fileType: response.data.fileType || file.type,
    storagePath: response.data.storagePath,
  };
}

/**
 * Delete a file from AWS S3 via the backend API.
 * @param {string} storagePath - The full object key path in S3
 * @returns {Promise<void>}
 */
export async function deleteFile(storagePath) {
  await axiosInstance.delete("/upload", {
    data: { storagePath },
  });
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
