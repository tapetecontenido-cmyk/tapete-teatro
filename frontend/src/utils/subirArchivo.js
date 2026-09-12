// src/utils/subirArchivo.js
// Sube archivos directo a Cloudinary usando un upload preset sin firma
export async function subirArchivo(archivo, carpeta = 'general') {
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = 'tapete_uploads';

  const formData = new FormData();
  formData.append('file', archivo);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', carpeta);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Error al subir el archivo');
  }

  const data = await res.json();
  return data.secure_url;
}