// Obtiene la tasa del día desde la API del BCV
// Usa múltiples fuentes con fallback
export async function obtenerTasaEuro() {
  const fuentes = [
    'https://pydolarve.org/api/v1/dollar?monitor=enparalelov2',
    'https://ve.dolarapi.com/v1/dolares/oficial',
  ];

  for (const url of fuentes) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();

      // pydolarve.org
      if (data.price) return parseFloat(data.price);
      // ve.dolarapi.com
      if (data.promedio) return parseFloat(data.promedio);
      if (data.tasa) return parseFloat(data.tasa);
    } catch {
      continue;
    }
  }

  // Fallback: tasa manual si todas las APIs fallan
  return null;
}

export function formatearBs(monto, tasa) {
  if (!tasa) return null;
  const enBs = monto * tasa;
  return enBs.toLocaleString('es-VE', { maximumFractionDigits: 0 });
}