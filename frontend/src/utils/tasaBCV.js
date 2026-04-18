export async function obtenerTasaEuro() {
  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tasa-bcv`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.tasa || null;
  } catch {
    return null;
  }
}

export function formatearBs(monto, tasa) {
  if (!tasa) return null;
  const enBs = monto * tasa;
  return enBs.toLocaleString('es-VE', { maximumFractionDigits: 0 });
}