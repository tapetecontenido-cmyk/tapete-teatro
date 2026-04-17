// src/components/public/SeatSelector.jsx
// Selector interactivo de asientos — Tapete Teatro
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { clsx } from 'clsx';
import { Info } from 'lucide-react';

// ── Tipos de asiento ───────────────────────────────────────────────────
const SEAT_TYPES = {
  vip:      { label: 'VIP',       class: 'seat-vip',      available: true  },
  general:  { label: 'General',   class: 'seat-general',  available: true  },
  selected: { label: 'Selec.',    class: 'seat-selected', available: false },
  occupied: { label: 'Ocupado',   class: 'seat-occupied', available: false },
  blocked:  { label: 'No disp.',  class: 'seat-blocked',  available: false },
};

export default function SeatSelector({
  funcionId,      // ID de la función en Firestore
  layoutConfig,   // config del croquis: { filas, columnas, filaNames, vipRange, pasilloCol, inhabilitados }
  precioVip,
  precioGeneral,
  onChange,       // (seatsSeleccionados) => void
  maxSeats = 6,
}) {
  const [asientosOcupados, setAsientosOcupados] = useState(new Set());
  const [seleccionados,    setSeleccionados]    = useState([]);
  const [hoveredSeat,      setHoveredSeat]      = useState(null);

  // ── Suscribirse a asientos ocupados en tiempo real ─────────────────
  useEffect(() => {
    if (!funcionId) return;
    const ref = doc(db, 'asientosOcupados', funcionId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setAsientosOcupados(new Set(snap.data().ocupados || []));
      }
    });
    return unsub;
  }, [funcionId]);

  // ── Notificar cambios hacia afuera ─────────────────────────────────
  useEffect(() => {
    onChange?.(seleccionados);
  }, [seleccionados]);

  if (!layoutConfig) return null;

  const {
    filas         = 8,
    columnas      = 12,
    filaNames     = [],
    vipFilas      = [],    // ['A', 'B']
    pasilloCol    = 6,
    inhabilitados = [],    // ['A3', 'B7', ...]
  } = layoutConfig;

  // ── Determinar tipo de asiento ─────────────────────────────────────
  const getSeatType = (fila, col) => {
    const seatId = `${fila}${col}`;
    if (asientosOcupados.has(seatId)) return 'occupied';
    if (inhabilitados.includes(seatId)) return 'blocked';
    if (seleccionados.includes(seatId)) return 'selected';
    if (vipFilas.includes(fila)) return 'vip';
    return 'general';
  };

  // ── Click en asiento ───────────────────────────────────────────────
  const handleSeatClick = (fila, col) => {
    const seatId = `${fila}${col}`;
    const tipo   = getSeatType(fila, col);

    if (tipo === 'occupied' || tipo === 'blocked') return;

    setSeleccionados(prev => {
      if (prev.includes(seatId)) {
        return prev.filter(s => s !== seatId);
      }
      if (prev.length >= maxSeats) return prev; // límite
      return [...prev, seatId];
    });
  };

  // ── Calcular precio total ──────────────────────────────────────────
  const calcTotal = () => {
    let total = 0;
    for (const seatId of seleccionados) {
      const fila = seatId[0];
      total += vipFilas.includes(fila) ? precioVip : precioGeneral;
    }
    return total;
  };

  const filaLabels = filaNames.length > 0
    ? filaNames
    : Array.from({ length: filas }, (_, i) => String.fromCharCode(65 + i));

  return (
    <div className="space-y-6">

      {/* Escenario */}
      <div className="relative">
        <div className="w-full max-w-md mx-auto bg-gradient-brand rounded-2xl py-3 px-6 text-center
                        text-white font-heading font-bold text-sm tracking-widest uppercase
                        shadow-brand-lg">
          ESCENARIO
        </div>
        <div className="w-3/4 mx-auto h-2 bg-gradient-brand opacity-20 rounded-b-full" />
      </div>

      {/* Grid de asientos */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex flex-col gap-1.5 items-center">
            {filaLabels.map((filaLabel, filaIdx) => (
              <div key={filaIdx} className="flex items-center gap-1.5">
                {/* Etiqueta de fila */}
                <span className="w-6 text-center text-xs font-heading font-bold text-gray-400 flex-shrink-0">
                  {filaLabel}
                </span>

                {/* Asientos izquierda */}
                <div className="flex gap-1">
                  {Array.from({ length: pasilloCol }, (_, colIdx) => {
                    const col    = colIdx + 1;
                    const seatId = `${filaLabel}${col}`;
                    const tipo   = getSeatType(filaLabel, col);
                    return (
                      <button
                        key={seatId}
                        onClick={() => handleSeatClick(filaLabel, col)}
                        onMouseEnter={() => setHoveredSeat(seatId)}
                        onMouseLeave={() => setHoveredSeat(null)}
                        className={clsx('seat', SEAT_TYPES[tipo].class)}
                        title={`${seatId} — ${SEAT_TYPES[tipo].label}`}
                        disabled={tipo === 'occupied' || tipo === 'blocked'}
                      >
                        {hoveredSeat === seatId ? col : ''}
                      </button>
                    );
                  })}
                </div>

                {/* Pasillo */}
                <div className="w-6 flex-shrink-0" />

                {/* Asientos derecha */}
                <div className="flex gap-1">
                  {Array.from({ length: columnas - pasilloCol }, (_, colIdx) => {
                    const col    = colIdx + pasilloCol + 1;
                    const seatId = `${filaLabel}${col}`;
                    const tipo   = getSeatType(filaLabel, col);
                    return (
                      <button
                        key={seatId}
                        onClick={() => handleSeatClick(filaLabel, col)}
                        onMouseEnter={() => setHoveredSeat(seatId)}
                        onMouseLeave={() => setHoveredSeat(null)}
                        className={clsx('seat', SEAT_TYPES[tipo].class)}
                        title={`${seatId} — ${SEAT_TYPES[tipo].label}`}
                        disabled={tipo === 'occupied' || tipo === 'blocked'}
                      >
                        {hoveredSeat === seatId ? col : ''}
                      </button>
                    );
                  })}
                </div>

                {/* Etiqueta derecha */}
                <span className="w-6 text-center text-xs font-heading font-bold text-gray-400 flex-shrink-0">
                  {filaLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap justify-center gap-4 py-4 border-t border-gray-100">
        {Object.entries(SEAT_TYPES).map(([key, { label, class: cls }]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={clsx('w-5 h-5 rounded', cls, 'border-2')} />
            <span className="text-xs text-gray-500 font-heading">{label}</span>
          </div>
        ))}
      </div>

      {/* Resumen de selección */}
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
                    className="bg-azul text-white text-xs font-heading font-bold
                               px-2.5 py-1 rounded-lg cursor-pointer hover:bg-red-500 transition-colors"
                    onClick={() => setSeleccionados(prev => prev.filter(x => x !== s))}
                    title="Clic para quitar"
                  >
                    {s} ✕
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-azul/15">
                <span className="text-sm text-gray-600">Total estimado:</span>
                <span className="font-display text-2xl text-azul font-bold">
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
