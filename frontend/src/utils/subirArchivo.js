// src/utils/subirArchivo.js
// Sube archivos directo a Cloudinary usando un upload preset sin firma.
// Incluye validaciones de tamaño y tipo en el cliente como mitigación
// de seguridad (Cloudinary no expone límites por preset en el plan gratuito).

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
const TAMANO_MAXIMO_MB = 8;

export async function subirArchivo(archivo, carpeta = 'general') {
  if (!archivo) throw new Error('No se seleccionó ningún archivo');

  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    throw new Error('Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, WEBP) y PDF.');
  }

  const tamanoMB = archivo.size / (1024 * 1024);
  if (tamanoMB > TAMANO_MAXIMO_MB) {
    throw new Error(`El archivo pesa demasiado (${tamanoMB.toFixed(1)}MB). Máximo permitido: ${TAMANO_MAXIMO_MB}MB.`);
  }

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