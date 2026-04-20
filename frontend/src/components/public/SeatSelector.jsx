// src/components/public/SeatSelector.jsx
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Info } from 'lucide-react';

const CELL = 36;

// Reconstruye el grid 2D desde cualquier formato
function reconstruirGrid(layoutConfig) {
  if (!layoutConfig?.grid) return null;
  const rawGrid = layoutConfig.grid;
  const cols = layoutConfig.cols || 14;
  const rows = layoutConfig.rows || 10;

  // Ya es array 2D
  if (Array.isArray(rawGrid[0])) return rawGrid;

  // Es array plano con _row/_col (formato Firestore)
  if (rawGrid[0]?._row !== undefined) {
    const grid2d = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ tipo: 'vacio', num: '' }))
    );
    rawGrid.forEach(cell => {
      const r = cell._row;
      const c = cell._col;
      if (r < rows && c < cols) {
        grid2d[r][c] = { tipo: cell.tipo, num: cell.num };
      }
    });
    return grid2d;
  }

  return null;
}

export default function SeatSelector({
  funcionId, layoutConfig, precioVip, precioGeneral, onChange, maxSeats = 6,
}) {
  const [asientosOcupados, setAsientosOcupados] = useState(new Set());
  const [seleccionados,    setSeleccionados]    = useState([]);

  useEffect(() => {
    if (!funcionId) return;
    const unsub = onSnapshot(doc(db, 'asientosOcupados', funcionId), snap => {
      if (snap.exists()) {
        const d = snap.data();
        setAsientosOcupados(new Set([...(d.ocupados||[]), ...(d.reservados||[])]));
      }
    });
    return unsub;
  }, [funcionId]);

  useEffect(() => { onChange?.(seleccionados); }, [seleccionados]);

  if (!layoutConfig) return null;

  const grid = reconstruirGrid(layoutConfig);

  if (!grid) {
    return (
      <div className="text-center py-8 text-gray-400 font-heading">
        <p>El croquis de esta obra aún no ha sido configurado.</p>
        <p className="text-sm mt-1">Configúralo desde el panel admin.</p>
      </div>
    );
  }

  const getSeatState = (num) => {
    if (asientosOcupados.has(num)) return 'ocupado';
    if (seleccionados.includes(num)) return 'seleccionado';
    return 'libre';
  };

  const handleClick = (cell) => {
    if (!cell || cell.tipo === 'vacio' || cell.tipo === 'escenario' || cell.tipo === 'inhabilitado') return;
    const num = cell.num;
    const state = getSeatState(num);
    if (state === 'ocupado') return;
    setSeleccionados(prev => {
      if (prev.includes(num)) return prev.filter(s => s !== num);
      if (prev.length >= maxSeats) return prev;
      return [...prev, num];
    });
  };

  const calcTotal = () => {
    let total = 0;
    for (const num of seleccionados) {
      let tipo = 'general';
      for (const row of grid) {
        for (const cell of row) {
          if (cell.num === num) { tipo = cell.tipo; break; }
        }
      }
      total += tipo === 'vip' ? (precioVip || 0) : (precioGeneral || 0);
    }
    return total;
  };

  const getCellStyle = (cell) => {
    const esSilla = cell.tipo === 'general' || cell.tipo === 'vip';
    if (!esSilla) return null;
    const state = getSeatState(cell.num);
    if (state === 'ocupado')      return { bg: '#e5e7eb', border: '#9ca3af', color: '#9ca3af', cursor: 'not-allowed' };
    if (state === 'seleccionado') return { bg: '#3333CC', border: '#2222AA', color: 'white',   cursor: 'pointer' };
    if (cell.tipo === 'vip')      return { bg: '#fef9c3', border: '#ca8a04', color: '#92400e', cursor: 'pointer' };
    return { bg: '#e0f2fe', border: '#299FE3', color: '#0369a1', cursor: 'pointer' };
  };

  return (
    <div className="space-y-6">
      {/* Grid */}
      <div className="overflow-auto">
        <div style={{ display: 'inline-block', userSelect: 'none' }}>
          {grid.map((row, r) => (
            <div key={r} style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
              {row.map((cell, c) => {
                const esSilla = cell.tipo === 'general' || cell.tipo === 'vip';
                const esEsc   = cell.tipo === 'escenario';
                const style   = esSilla ? getCellStyle(cell) : null;
                return (
                  <div key={c}
                    onClick={() => handleClick(cell)}
                    style={{
                      width:  CELL,
                      height: CELL,
                      flexShrink: 0,
                      background: esEsc    ? 'linear-gradient(135deg,#3333CC,#299FE3)'
                        : esSilla          ? style.bg
                        : cell.tipo === 'inhabilitado' ? '#f3f4f6'
                        : 'transparent',
                      border: `1.5px solid ${
                        esEsc              ? '#2222AA'
                        : esSilla          ? style.border
                        : cell.tipo === 'inhabilitado' ? '#d1d5db'
                        : '#f3f4f6'
                      }`,
                      borderRadius: esEsc ? 4 : esSilla ? 8 : 3,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: esSilla ? style.cursor : 'default',
                      transition: 'background 0.15s, transform 0.1s',
                      transform: esSilla && getSeatState(cell.num) === 'seleccionado' ? 'scale(1.1)' : 'scale(1)',
                      boxShadow: esSilla && getSeatState(cell.num) === 'seleccionado' ? '0 2px 8px rgba(51,51,204,0.4)' : 'none',
                    }}
                  >
                    {esSilla && (
                      <span style={{
                        fontSize: cell.num?.length > 2 ? 9 : 11,
                        fontFamily: '"Bebas Neue",sans-serif',
                        color: style.color, fontWeight: 'bold', lineHeight: 1,
                      }}>
                        {cell.num}
                      </span>
                    )}
                    {esEsc && (
                      <span style={{ fontSize: 8, fontFamily: '"Bebas Neue",sans-serif', color: 'white', letterSpacing: 1 }}>
                        ESC
                      </span>
                    )}
                    {cell.tipo === 'inhabilitado' && (
                      <span style={{ fontSize: 11, color: '#d1d5db' }}>✕</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap justify-center gap-4 py-4 border-t border-gray-100 text-xs text-gray-500 font-heading">
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded border-2 border-cyan bg-cyan/20 inline-block" /> General</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded border-2 border-yellow-400 bg-yellow-100 inline-block" /> VIP</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-azul inline-block" /> Seleccionado</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded border-2 border-gray-300 bg-gray-200 inline-block opacity-60" /> Ocupado</span>
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
                <span className="text-2xl text-azul font-bold" style={{ fontFamily: '"Bebas Neue",sans-serif' }}>
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
