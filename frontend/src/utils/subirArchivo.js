import { auth } from '../services/firebase';

export async function subirArchivo(archivo, carpeta = 'comprobantes') {
  const formData = new FormData();
  formData.append('archivo', archivo);
  formData.append('carpeta', carpeta);

  // Intentar obtener token si hay sesión, si no enviar sin token
  const headers = {};
  try {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    // Sin sesión, continuar sin token
  }

  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) throw new Error('Error al subir archivo');
  const data = await res.json();
  return data.url;
}