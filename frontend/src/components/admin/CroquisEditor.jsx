// src/components/admin/CroquisEditor.jsx
// Editor de croquis por cuadrícula
import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { RotateCcw, Plus, Minus } from 'lucide-react';

const CELL = 36; // px por celda

// Tipos de celda
const TIPOS = {
  vacio:       { bg: 'transparent', border: '#e5e7eb',  label: '' },
  escenario:   { bg: '#3333CC',     border: '#2222AA',  label: 'ESC' },
  general:     { bg: '#e0f2fe',     border: '#299FE3',  label: '' },
  vip:         { bg: '#fef9c3',     border: '#ca8a04',  label: '★' },
  inhabilitado:{ bg: '#f3f4f6',     border: '#d1d5db',  label: '✕' },
};

const HERRAMIENTAS = [
  { id: 'escenario',    label: 'Escenario',    color: 'bg-azul text-white' },
  { id: 'general',      label: 'Silla general', color: 'bg-cyan/20 text-cyan border border-cyan' },
  { id: 'vip',          label: 'Silla VIP',     color: 'bg-yellow-100 text-yellow-700 border border-yellow-400' },
  { id: 'inhabilitado', label: 'Inhabilitado',  color: 'bg-gray-100 text-gray-500 border border-gray-300' },
  { id: 'borrar',       label: 'Borrar',        color: 'bg-red-50 text-red-400 border border-red-200' },
];

export default function CroquisEditor({ config, onChange }) {
  const COLS_DEFAULT = 14;
  const ROWS_DEFAULT = 10;

  // Inicializar grid desde config
  const initGrid = () => {
  const cols = config?.cols || COLS_DEFAULT;
  const rows = config?.rows || ROWS_DEFAULT;
  // Formato nuevo (array 2D)
  if (config?.grid?.length === rows && Array.isArray(config?.grid?.[0])) {
    return config.grid.map(row => row.map(cell => ({ ...cell })));
  }
  // Formato Firestore (array plano con _row/_col)
  if (config?.grid?.length > 0 && config.grid[0]._row !== undefined) {
    const grid2d = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ tipo: 'vacio', num: '' }))
    );
    config.grid.forEach(cell => {
      if (cell._row < rows && cell._col < cols) {
        grid2d[cell._row][cell._col] = { tipo: cell.tipo, num: cell.num };
      }
    });
    return grid2d;
  }
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ tipo: 'vacio', num: '' }))
  );
};

  const [cols,      setCols]      = useState(() => config?.cols || COLS_DEFAULT);
  const [rows,      setRows]      = useState(() => config?.rows || ROWS_DEFAULT);
  const [grid,      setGrid]      = useState(initGrid);
  const [tool,      setTool]      = useState('escenario');
  const [painting, setPainting]  = useState(false);
  const [nextNum,   setNextNum]   = useState(() => {
    if (!config?.grid) return 1;
    let max = 0;
    config.grid.forEach(row => row.forEach(cell => {
      const n = parseInt(cell.num);
      if (!isNaN(n) && n > max) max = n;
    }));
    return max + 1;
  });

  // Sync hacia afuera
  useEffect(() => {
    onChange?.({ ...config, grid, cols, rows });
  }, [grid, cols, rows]);

  // Resize grid cuando cambian cols/rows
  const resizeGrid = useCallback((newCols, newRows) => {
    setGrid(prev => {
      return Array.from({ length: newRows }, (_, r) =>
        Array.from({ length: newCols }, (_, c) =>
          prev[r]?.[c] ?? { tipo: 'vacio', num: '' }
        )
      );
    });
  }, []);

  const setColunas = (n) => {
    const v = Math.max(5, Math.min(20, n));
    setCols(v); resizeGrid(v, rows);
  };
  const setFilas = (n) => {
    const v = Math.max(4, Math.min(18, n));
    setRows(v); resizeGrid(cols, v);
  };

  // Pintar celda
  const pintarCelda = useCallback((r, c) => {
    setGrid(prev => {
      const next = prev.map(row => row.map(cell => ({ ...cell })));
      const cell = next[r][c];

      if (tool === 'borrar') {
        next[r][c] = { tipo: 'vacio', num: '' };
      } else if (tool === 'escenario') {
        next[r][c] = { tipo: 'escenario', num: '' };
      } else if (tool === 'inhabilitado') {
        next[r][c] = { tipo: 'inhabilitado', num: '' };
      } else if (tool === 'general' || tool === 'vip') {
        // Si ya es silla del mismo tipo, no cambiar número
        if (cell.tipo === tool) return prev;
        // Si era otro tipo, asignar nuevo número
        const num = cell.tipo === 'general' || cell.tipo === 'vip' ? cell.num : String(nextNum);
        next[r][c] = { tipo: tool, num };
        if (!(cell.tipo === 'general' || cell.tipo === 'vip')) {
          setNextNum(n => n + 1);
        }
      }
      return next;
    });
  }, [tool, nextNum]);

  const handleMouseDown = (r, c) => { setPainting(true); pintarCelda(r, c); };
  const handleMouseEnter = (r, c) => { if (painting) pintarCelda(r, c); };
  const handleMouseUp = () => setPainting(false);

  const limpiar = () => {
    if (!confirm('¿Limpiar todo el croquis?')) return;
    setGrid(Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ tipo: 'vacio', num: '' }))
    ));
    setNextNum(1);
  };

  const renumerar = () => {
    let n = 1;
    setGrid(prev => prev.map(row => row.map(cell => {
      if (cell.tipo === 'general' || cell.tipo === 'vip') {
        const updated = { ...cell, num: String(n++) };
        return updated;
      }
      return cell;
    })));
    setNextNum(n);
  };

  // Stats
  const sillasTotal    = grid.flat().filter(c => c.tipo === 'general' || c.tipo === 'vip').length;
  const sillasVip      = grid.flat().filter(c => c.tipo === 'vip').length;
  const sillasInh      = grid.flat().filter(c => c.tipo === 'inhabilitado').length;
  const celdasEscenario = grid.flat().filter(c => c.tipo === 'escenario').length;

  return (
    <div className="space-y-3" onMouseUp={handleMouseUp}>

      {/* Controles de tamaño */}
      <div className="flex flex-wrap gap-3 items-center p-2.5 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 font-heading font-bold">Columnas:</span>
          <button type="button" onClick={() => setColunas(cols - 1)} className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"><Minus size={10} /></button>
          <span className="text-xs font-heading font-bold w-5 text-center">{cols}</span>
          <button type="button" onClick={() => setColunas(cols + 1)} className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"><Plus size={10} /></button>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 font-heading font-bold">Filas:</span>
          <button type="button" onClick={() => setFilas(rows - 1)} className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"><Minus size={10} /></button>
          <span className="text-xs font-heading font-bold w-5 text-center">{rows}</span>
          <button type="button" onClick={() => setFilas(rows + 1)} className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"><Plus size={10} /></button>
        </div>
        <div className="flex gap-1.5 ml-auto">
          <button type="button" onClick={renumerar} className="px-2.5 py-1 rounded-lg bg-azul/10 text-azul text-xs font-heading font-bold hover:bg-azul/20 transition-colors">
            # Renumerar
          </button>
          <button type="button" onClick={limpiar} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-400 text-xs font-heading font-bold hover:bg-red-100 transition-colors">
            <RotateCcw size={10} /> Limpiar
          </button>
        </div>
      </div>

      {/* Herramientas */}
      <div className="flex flex-wrap gap-1.5">
        {HERRAMIENTAS.map(h => (
          <button key={h.id} type="button" onClick={() => setTool(h.id)}
            className={clsx('px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all',
              h.color,
              tool === h.id ? 'ring-2 ring-offset-1 ring-azul scale-105' : 'opacity-70 hover:opacity-100')}>
            {h.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="overflow-auto border border-gray-200 rounded-xl bg-white p-3" style={{ maxHeight: 400 }}>
        <div
          style={{ display: 'inline-block', userSelect: 'none' }}
          onMouseLeave={() => setPainting(false)}
        >
          {grid.map((row, r) => (
            <div key={r} style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
              {row.map((cell, c) => {
                const tipo = TIPOS[cell.tipo] || TIPOS.vacio;
                const esSilla = cell.tipo === 'general' || cell.tipo === 'vip';
                const esEsc   = cell.tipo === 'escenario';
                return (
                  <div
                    key={c}
                    onMouseDown={() => handleMouseDown(r, c)}
                    onMouseEnter={() => handleMouseEnter(r, c)}
                    style={{
                      width:  CELL,
                      height: CELL,
                      background: tipo.bg,
                      border: `1.5px solid ${tipo.border}`,
                      borderRadius: esEsc ? 4 : esSilla ? 8 : 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'crosshair',
                      flexShrink: 0,
                      transition: 'background 0.1s',
                      boxShadow: esEsc ? '0 2px 8px rgba(51,51,204,0.3)' : 'none',
                    }}
                  >
                    {esSilla && (
                      <span style={{
                        fontSize: cell.num.length > 2 ? 9 : 11,
                        fontFamily: '"Bebas Neue",sans-serif',
                        color: cell.tipo === 'vip' ? '#92400e' : '#0369a1',
                        fontWeight: 'bold',
                        lineHeight: 1,
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
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>✕</span>
                    )}
                    {cell.tipo === 'vacio' && (
                      <span style={{ fontSize: 8, color: '#e5e7eb' }}>·</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Stats y leyenda */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 font-heading">
        <div className="flex gap-3 flex-wrap">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-azul inline-block" /> Escenario ({celdasEscenario})</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-cyan bg-cyan/20 inline-block" /> General</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-yellow-400 bg-yellow-100 inline-block" /> VIP</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-gray-300 bg-gray-100 inline-block" /> Inh.</span>
        </div>
        <span className="font-bold text-gray-700">
          {sillasTotal - sillasInh} activas · {sillasVip} VIP
        </span>
      </div>

      <p className="text-xs text-gray-400 font-heading">
        💡 Selecciona una herramienta y haz clic (o arrastra) sobre las celdas para diseñar el croquis
      </p>
    </div>
  );
}
