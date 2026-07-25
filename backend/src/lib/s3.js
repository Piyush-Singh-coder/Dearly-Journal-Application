import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION || "us-east-1";
const bucketName = process.env.AWS_S3_BUCKET_NAME;

export const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Uploads a file buffer directly to AWS S3.
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} key - S3 Object key / file path (e.g. "avatars/user1-12345.jpg")
 * @param {string} mimeType - File MIME type (e.g. "image/jpeg" or "audio/mpeg")
 * @returns {Promise<string>} The public URL of the uploaded S3 object
 */
export async function uploadToS3(buffer, key, mimeType) {
  if (!bucketName) {
    throw new Error("AWS_S3_BUCKET_NAME is not configured in environment variables.");
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  // Return public S3 URL
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Deletes an object from AWS S3 bucket.
 * @param {string} key - S3 Object key / file path
 */
export async function deleteFromS3(key) {
  if (!bucketName) return;

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
}
