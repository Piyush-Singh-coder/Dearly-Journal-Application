/**
 * uploadFile — Upload an image file through the backend (bypasses Supabase RLS).
 *
 * @param {File} file     - The File object from an <input type="file">
 * @param {string} folder - Supabase sub-folder, e.g. "avatars" or "covers"
 * @returns {Promise<string>} The public URL of the uploaded file
 */
export async function uploadFile(file, folder = "uploads") {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const res = await fetch(
    `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // NOTE: Do NOT set Content-Type — browser sets it with the boundary automatically
      },
      body: formData,
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(err.message || "Upload failed");
  }

  const data = await res.json();
  return data.url;
}
