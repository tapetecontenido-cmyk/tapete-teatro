// src/components/public/SeatSelector.jsx
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { clsx } from 'clsx';
import { Info } from 'lucide-react';

const SEAT_TYPES = {
  vip:      { label: 'VIP',      class: 'seat-vip' },
  general:  { label: 'General',  class: 'seat-general' },
  selected: { label: 'Selec.',   class: 'seat-selected' },
  occupied: { label: 'Ocupado',  class: 'seat-occupied' },
  blocked:  { label: 'No disp.', class: 'seat-blocked' },
};

export default function SeatSelector({
  funcionId,
  layoutConfig,
  precioVip,
  precioGeneral,
  onChange,
  maxSeats = 6,
}) {
  const [asientosOcupados, setAsientosOcupados] = useState(new Set());
  const [seleccionados,    setSeleccionados]    = useState([]);

  useEffect(() => {
    if (!funcionId) return;
    const ref = doc(db, 'asientosOcupados', funcionId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setAsientosOcupados(new Set([
          ...(data.ocupados  || []),
          ...(data.reservados || []),
        ]));
      }
    });
    return unsub;
  }, [funcionId]);

  useEffect(() => {
    onChange?.(seleccionados);
  }, [seleccionados]);

  if (!layoutConfig) return null;

  const {
    totalSillas       = 30,
    filas             = 5,
    posicionEscenario = 'arriba',
    vipFilas          = [],
    inhabilitados     = [],
  } = layoutConfig;

  const colsPorFila = Math.ceil(totalSillas / filas);

  // Numeración global: asiento 1, 2, 3...
  const getSeatId = (filaIdx, colIdx) => {
    return String(filaIdx * colsPorFila + colIdx + 1);
  };

  const getSeatType = (seatId, filaIdx) => {
    if (asientosOcupados.has(seatId))  return 'occupied';
    if (inhabilitados.includes(seatId)) return 'blocked';
    if (seleccionados.includes(seatId)) return 'selected';
    // VIP por fila (usando letra de fila para compatibilidad)
    const filaLetra = String.fromCharCode(65 + filaIdx);
    if (vipFilas.includes(filaLetra))   return 'vip';
    return 'general';
  };

  const handleSeatClick = (seatId, filaIdx) => {
    const tipo = getSeatType(seatId, filaIdx);
    if (tipo === 'occupied' || tipo === 'blocked') return;
    setSeleccionados(prev => {
      if (prev.includes(seatId)) return prev.filter(s => s !== seatId);
      if (prev.length >= maxSeats) return prev;
      return [...prev, seatId];
    });
  };

  const calcTotal = () => {
    let total = 0;
    for (const seatId of seleccionados) {
      // Determinar si es VIP por el número del asiento
      const num  = Number(seatId);
      const fi   = Math.floor((num - 1) / colsPorFila);
      const letra = String.fromCharCode(65 + fi);
      total += vipFilas.includes(letra) ? precioVip : precioGeneral;
    }
    return total;
  };

  // Genera una fila de asientos
  const FilaAsientos = ({ filaIdx, numCols, offsetNum = 0 }) => (
    <div className="flex gap-1 flex-wrap justify-center">
      {Array.from({ length: numCols }, (_, ci) => {
        const seatId = String(filaIdx * colsPorFila + ci + 1 + offsetNum);
        const tipo   = getSeatType(seatId, filaIdx);
        return (
          <button key={seatId}
            onClick={() => handleSeatClick(seatId, filaIdx)}
            className={clsx('seat', SEAT_TYPES[tipo].class)}
            title={`Asiento ${seatId}`}
            disabled={tipo === 'occupied' || tipo === 'blocked'}
          >
            <span className="text-xs">{seatId}</span>
          </button>
        );
      })}
    </div>
  );

  const Escenario = ({ className = 'w-full max-w-sm mx-auto' }) => (
    <div className={clsx('bg-gradient-brand rounded-2xl py-3 px-6 text-center text-white font-heading font-bold text-sm tracking-widest uppercase shadow-brand-lg', className)}>
      ESCENARIO
    </div>
  );

  // Render según posición del escenario
  const renderCroquis = () => {
    if (posicionEscenario === 'arriba') {
      return (
        <div className="flex flex-col gap-3 items-center">
          <Escenario />
          <div className="w-full h-px bg-gradient-brand opacity-20" />
          <div className="flex flex-col gap-1.5 w-full">
            {Array.from({ length: filas }, (_, fi) => (
              <FilaAsientos key={fi} filaIdx={fi} numCols={colsPorFila} />
            ))}
          </div>
        </div>
      );
    }

    if (posicionEscenario === 'abajo') {
      return (
        <div className="flex flex-col gap-3 items-center">
          <div className="flex flex-col gap-1.5 w-full">
            {Array.from({ length: filas }, (_, fi) => (
              <FilaAsientos key={fi} filaIdx={fi} numCols={colsPorFila} />
            ))}
          </div>
          <div className="w-full h-px bg-gradient-brand opacity-20" />
          <Escenario />
        </div>
      );
    }

    if (posicionEscenario === 'izquierda') {
      return (
        <div className="flex gap-4 items-center">
          <div className="bg-gradient-brand text-white text-center text-xs font-heading font-bold rounded-xl px-3 py-8 flex-shrink-0 writing-mode-vertical">
            ESCENARIO
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            {Array.from({ length: filas }, (_, fi) => (
              <FilaAsientos key={fi} filaIdx={fi} numCols={colsPorFila} />
            ))}
          </div>
        </div>
      );
    }

    if (posicionEscenario === 'derecha') {
      return (
        <div className="flex gap-4 items-center">
          <div className="flex flex-col gap-1.5 flex-1">
            {Array.from({ length: filas }, (_, fi) => (
              <FilaAsientos key={fi} filaIdx={fi} numCols={colsPorFila} />
            ))}
          </div>
          <div className="bg-gradient-brand text-white text-center text-xs font-heading font-bold rounded-xl px-3 py-8 flex-shrink-0">
            ESCENARIO
          </div>
        </div>
      );
    }

    // Centro — sillas en 4 lados
    if (posicionEscenario === 'centro') {
      const sillasPorLado = Math.floor(totalSillas / 4);
      const resto = totalSillas % 4;
      const sArr  = sillasPorLado + (resto > 0 ? 1 : 0);
      const sAbj  = sillasPorLado + (resto > 1 ? 1 : 0);
      const sIzq  = sillasPorLado + (resto > 2 ? 1 : 0);
      const sDer  = sillasPorLado;

      let counter = 1;

      const SillasLateral = ({ count, start }) => (
        <div className="flex flex-col gap-1">
          {Array.from({ length: count }, (_, i) => {
            const seatId = String(start + i);
            const tipo = getSeatType(seatId, 0);
            return (
              <button key={seatId}
                onClick={() => handleSeatClick(seatId, 0)}
                className={clsx('seat', SEAT_TYPES[tipo].class)}
                title={`Asiento ${seatId}`}
                disabled={tipo === 'occupied' || tipo === 'blocked'}
              >
                <span className="text-xs">{seatId}</span>
              </button>
            );
          })}
        </div>
      );

      const SillasHorizontal = ({ count, start }) => (
        <div className="flex gap-1 justify-center">
          {Array.from({ length: count }, (_, i) => {
            const seatId = String(start + i);
            const tipo = getSeatType(seatId, 0);
            return (
              <button key={seatId}
                onClick={() => handleSeatClick(seatId, 0)}
                className={clsx('seat', SEAT_TYPES[tipo].class)}
                title={`Asiento ${seatId}`}
                disabled={tipo === 'occupied' || tipo === 'blocked'}
              >
                <span className="text-xs">{seatId}</span>
              </button>
            );
          })}
        </div>
      );

      const startArr = 1;
      const startIzq = startArr + sArr;
      const startDer = startIzq + sIzq;
      const startAbj = startDer + sDer;

      return (
        <div className="flex flex-col gap-2 items-center">
          <SillasHorizontal count={sArr} start={startArr} />
          <div className="flex gap-3 items-center">
            <SillasLateral count={sIzq} start={startIzq} />
            <div className="bg-gradient-brand text-white text-center text-xs font-heading font-bold py-8 px-6 rounded-xl">
              ESCENARIO
            </div>
            <SillasLateral count={sDer} start={startDer} />
          </div>
          <SillasHorizontal count={sAbj} start={startAbj} />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <div className="min-w-full flex justify-center">
          {renderCroquis()}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap justify-center gap-4 py-4 border-t border-gray-100">
        {Object.entries(SEAT_TYPES).map(([key, { label, class: cls }]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={clsx('w-5 h-5 rounded seat', cls)} />
            <span className="text-xs text-gray-500 font-heading">{label}</span>
          </div>
        ))}
      </div>

      {/* Resumen */}
      {seleccionados.length > 0 && (
        <div className="bg-azul/5 border border-azul/15 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-azul mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-heading font-bold text-gray-900 mb-2">
                {seleccionados.length} asiento{seleccionados.length > 1 ? 's' : ''} seleccionado{seleccionados.length > 1 ? 's' : ''}
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {seleccionados.map(s => (
                  <span key={s}
                    className="bg-azul text-white text-xs font-heading font-bold px-2.5 py-1 rounded-lg cursor-pointer hover:bg-red-500 transition-colors"
                    onClick={() => setSeleccionados(prev => prev.filter(x => x !== s))}
                    title="Clic para quitar"
                  >
                    #{s} ✕
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-azul/15">
                <span className="text-sm text-gray-600">Total estimado:</span>
                <span className="text-2xl text-azul font-bold" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                  ${calcTotal()} <span className="text-sm font-body font-normal text-gray-400">USD</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {seleccionados.length === maxSeats && (
        <p className="text-center text-sm text-amber-600 font-heading font-bold">
          Máximo {maxSeats} asientos por compra
        </p>
      )}
    </div>
  );
}
