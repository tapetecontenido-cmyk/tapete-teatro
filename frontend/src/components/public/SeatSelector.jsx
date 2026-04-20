// src/components/public/SeatSelector.jsx
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { clsx } from 'clsx';
import { Info } from 'lucide-react';

const GRID = 40;

const FORMAS = {
  rect: { borderRadius: 12 },
  round: { borderRadius: '50%' },
  hex: { borderRadius: 12, clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' },
  tri: { clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)', borderRadius: 0 },
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
          ...(data.ocupados   || []),
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

  const { sillas = [], escenario = { x: 0, y: 0, w: 200, h: 80, forma: 'rect' } } = layoutConfig;

  // Compatibilidad con formato antiguo (sin sillas libres)
  const esFormatoNuevo = sillas.length > 0;

  const getSeatType = (num) => {
    if (asientosOcupados.has(num))    return 'occupied';
    const silla = sillas.find(s => s.num === num);
    if (silla?.estado === 'inhabilitado') return 'blocked';
    if (seleccionados.includes(num))      return 'selected';
    if (silla?.estado === 'vip')          return 'vip';
    return 'general';
  };

  const handleSeatClick = (num) => {
    const tipo = getSeatType(num);
    if (tipo === 'occupied' || tipo === 'blocked') return;
    setSeleccionados(prev => {
      if (prev.includes(num)) return prev.filter(s => s !== num);
      if (prev.length >= maxSeats) return prev;
      return [...prev, num];
    });
  };

  const calcTotal = () => {
    let total = 0;
    for (const num of seleccionados) {
      const silla = sillas.find(s => s.num === num);
      total += silla?.estado === 'vip' ? precioVip : precioGeneral;
    }
    return total;
  };

  const colorSilla = (tipo) => ({
    general:  'bg-blue-50 border-cyan hover:bg-blue-100',
    vip:      'bg-yellow-50 border-yellow-400 hover:bg-yellow-100',
    selected: 'bg-azul border-azul text-white',
    occupied: 'bg-gray-200 border-gray-300 opacity-60 cursor-not-allowed',
    blocked:  'bg-gray-100 border-gray-200 opacity-40 cursor-not-allowed',
  }[tipo] || 'bg-blue-50 border-cyan');

  // Calcular dimensiones del canvas
  const canvasW = esFormatoNuevo
    ? Math.max(500, ...sillas.map(s => s.x + GRID + 20), escenario.x + escenario.w + 20)
    : 500;
  const canvasH = esFormatoNuevo
    ? Math.max(400, ...sillas.map(s => s.y + GRID + 20), escenario.y + escenario.h + 20)
    : 400;

  const formaStyle = FORMAS[escenario.forma] || FORMAS.rect;

  if (!esFormatoNuevo) {
    return (
      <div className="text-center py-8 text-gray-400 font-heading">
        <p>El croquis de esta obra aún no ha sido configurado.</p>
        <p className="text-sm mt-1">Contacta al administrador.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Canvas libre — solo lectura para el comprador */}
      <div className="overflow-auto border border-gray-200 rounded-2xl bg-white">
        <div
          style={{
            position: 'relative',
            width: canvasW,
            height: canvasH,
            backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
            backgroundSize: `${GRID}px ${GRID}px`,
          }}
        >
          {/* Escenario */}
          <div style={{
            position: 'absolute',
            left: escenario.x,
            top:  escenario.y,
            width:  escenario.w,
            height: escenario.h,
            background: 'linear-gradient(135deg, #3333CC, #299FE3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 14,
            letterSpacing: 2,
            boxShadow: '0 4px 20px rgba(51,51,204,0.3)',
            ...formaStyle,
          }}>
            {escenario.forma === 'tri' ? <span style={{ marginTop: 24 }}>ESCENARIO</span> : 'ESCENARIO'}
          </div>

          {/* Sillas */}
          {sillas.map(s => {
            const tipo = getSeatType(s.num);
            return (
              <button
                key={s.id}
                onClick={() => handleSeatClick(s.num)}
                disabled={tipo === 'occupied' || tipo === 'blocked'}
                title={`Asiento ${s.num}${s.estado === 'vip' ? ' (VIP)' : ''}`}
                style={{
                  position: 'absolute',
                  left: s.x,
                  top:  s.y,
                  width:  GRID - 4,
                  height: GRID - 4,
                }}
                className={clsx(
                  'rounded-lg border-2 text-xs font-bold transition-all flex items-center justify-center',
                  colorSilla(tipo),
                  tipo === 'selected' && 'scale-110 shadow-lg',
                  tipo === 'vip' && 'font-heading',
                )}
              >
                {s.num}
              </button>
            );
          })}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap justify-center gap-4 py-4 border-t border-gray-100">
        {[
          { tipo: 'general',  label: 'General',   cls: 'bg-blue-50 border-cyan border-2' },
          { tipo: 'vip',      label: 'VIP',        cls: 'bg-yellow-50 border-yellow-400 border-2' },
          { tipo: 'selected', label: 'Selec.',     cls: 'bg-azul border-azul border-2' },
          { tipo: 'occupied', label: 'Ocupado',    cls: 'bg-gray-200 border-gray-300 border-2 opacity-60' },
        ].map(({ label, cls }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={clsx('w-5 h-5 rounded', cls)} />
            <span className="text-xs text-gray-500 font-heading">{label}</span>
          </div>
        ))}
      </div>

      {/* Resumen selección */}
      {seleccionados.length > 0 && (
        <div className="bg-azul/5 border border-azul/15 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-azul mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-heading font-bold text-gray-900 mb-2">
                {seleccionados.length} asiento{seleccionados.length > 1 ? 's' : ''} seleccionado{seleccionados.length > 1 ? 's' : ''}
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {seleccionados.map(num => (
                  <span key={num}
                    className="bg-azul text-white text-xs font-heading font-bold px-2.5 py-1 rounded-lg cursor-pointer hover:bg-red-500 transition-colors"
                    onClick={() => setSeleccionados(prev => prev.filter(x => x !== num))}
                    title="Clic para quitar">
                    #{num} ✕
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-azul/15">
                <span className="text-sm text-gray-600">Total estimado:</span>
                <span className="text-2xl text-azul font-bold" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                  ${calcTotal()} <span className="text-sm font-normal text-gray-400">USD</span>
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
