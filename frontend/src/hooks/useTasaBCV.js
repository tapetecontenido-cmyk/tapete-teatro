import { useState, useEffect } from 'react';
import { obtenerTasaEuro, formatearBs } from '../utils/tasaBCV';

export function useTasaBCV() {
  const [tasa, setTasa] = useState(null);

  useEffect(() => {
    obtenerTasaEuro().then(t => setTasa(t));
  }, []);

  const convertir = (monto) => formatearBs(monto, tasa);

  return { tasa, convertir };
}