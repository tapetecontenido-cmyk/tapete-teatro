import { auth } from '../services/firebase';

export async function subirArchivo(archivo, carpeta = 'comprobantes') {
  const token    = await auth.currentUser.getIdToken();
  const formData = new FormData();
  formData.append('archivo', archivo);
  formData.append('carpeta', carpeta);

  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/upload`, {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body:    formData,
  });

  if (!res.ok) throw new Error('Error al subir archivo');
  const data = await res.json();
  return data.url;
}