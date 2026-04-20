// src/components/admin/CroquisEditor.jsx
// Editor visual de planta libre con drag & drop
import { useState, useRef, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';
import { Plus, Trash2, RotateCcw, Square, Circle, Triangle, Hexagon } from 'lucide-react';

const FORMAS_ESCENARIO = [
  { id: 'rect',   label: 'Rectangular', icon: <Square size={14} /> },
  { id: 'round',  label: 'Ovalado',     icon: <Circle size={14} /> },
  { id: 'hex',    label: 'Hexagonal',   icon: <Hexagon size={14} /> },
  { id: 'tri',    label: 'Triangular',  icon: <Triangle size={14} /> },
];

const GRID = 40; // px por celda

// Convierte posición del mouse a celda del grid
function snapToGrid(x, y) {
  return {
    x: Math.round(x / GRID) * GRID,
    y: Math.round(y / GRID) * GRID,
  };
}

// Renderiza el escenario según forma
function EscenarioShape({ forma, w, h }) {
  const estiloBase = {
    width:  w,
    height: h,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #3333CC, #299FE3)',
    color: 'white',
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: 14,
    letterSpacing: 2,
    userSelect: 'none',
    boxShadow: '0 4px 20px rgba(51,51,204,0.4)',
  };

  if (forma === 'round') {
    return <div style={{ ...estiloBase, borderRadius: '50%' }}>ESCENARIO</div>;
  }
  if (forma === 'hex') {
    return (
      <div style={{ ...estiloBase, borderRadius: '12px', clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}>
        ESCENARIO
      </div>
    );
  }
  if (forma === 'tri') {
    return (
      <div style={{ ...estiloBase, clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)', borderRadius: 0 }}>
        <span style={{ marginTop: 30 }}>ESC</span>
      </div>
    );
  }
  return <div style={{ ...estiloBase, borderRadius: 12 }}>ESCENARIO</div>;
}

export default function CroquisEditor({ config, onChange }) {
  const canvasRef = useRef(null);

  // Estado del editor
  const [sillas, setSillas] = useState(() => config?.sillas || []);
  const [escenario, setEscenario] = useState(() => config?.escenario || {
    x: 160, y: 40, w: 200, h: 80, forma: 'rect'
  });
  const [formaEsc, setFormaEsc] = useState(() => config?.escenario?.forma || 'rect');

  // Drag state
  const dragging = useRef(null); // { type: 'silla'|'escenario', id?, offsetX, offsetY }
  const resizing = useRef(null); // { dir: 'se'|'sw'|'ne'|'nw', startX, startY, startW, startH }

  // Herramienta activa
  const [tool, setTool] = useState('select'); // 'select' | 'add'
  const [nextNum, setNextNum] = useState(() => {
    const nums = (config?.sillas || []).map(s => parseInt(s.num) || 0);
    return nums.length > 0 ? Math.max(...nums) + 1 : 1;
  });

  // Silla seleccionada para editar número
  const [selected, setSelected] = useState(null);
  const [editingNum, setEditingNum] = useState('');

  // Sync hacia afuera
  useEffect(() => {
    onChange?.({ ...config, sillas, escenario: { ...escenario, forma: formaEsc } });
  }, [sillas, escenario, formaEsc]);

  // ── MOUSE DOWN ──────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (tool === 'add') {
      const pos = snapToGrid(mx - GRID / 2, my - GRID / 2);
      const nueva = { id: Date.now(), x: pos.x, y: pos.y, num: String(nextNum), estado: 'general' };
      setSillas(prev => [...prev, nueva]);
      setNextNum(n => n + 1);
      return;
    }

    // Verificar click en escenario
    if (
      mx >= escenario.x && mx <= escenario.x + escenario.w &&
      my >= escenario.y && my <= escenario.y + escenario.h
    ) {
      dragging.current = {
        type: 'escenario',
        offsetX: mx - escenario.x,
        offsetY: my - escenario.y,
      };
      setSelected(null);
      return;
    }

    // Verificar click en silla
    for (const s of [...sillas].reverse()) {
      if (mx >= s.x && mx <= s.x + GRID && my >= s.y && my <= s.y + GRID) {
        dragging.current = { type: 'silla', id: s.id, offsetX: mx - s.x, offsetY: my - s.y };
        setSelected(s.id);
        setEditingNum(s.num);
        return;
      }
    }

    setSelected(null);
  }, [tool, sillas, escenario, nextNum]);

  // ── MOUSE MOVE ──────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (dragging.current.type === 'escenario') {
      const pos = snapToGrid(mx - dragging.current.offsetX, my - dragging.current.offsetY);
      setEscenario(prev => ({ ...prev, x: Math.max(0, pos.x), y: Math.max(0, pos.y) }));
    } else if (dragging.current.type === 'silla') {
      const pos = snapToGrid(mx - dragging.current.offsetX, my - dragging.current.offsetY);
      setSillas(prev => prev.map(s =>
        s.id === dragging.current.id
          ? { ...s, x: Math.max(0, pos.x), y: Math.max(0, pos.y) }
          : s
      ));
    }
  }, []);

  // ── MOUSE UP ────────────────────────────────────────────────────────
  const handleMouseUp = useCallback(() => {
    dragging.current = null;
  }, []);

  // ── TOUCH SUPPORT ───────────────────────────────────────────────────
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
  }, [handleMouseDown]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  }, [handleMouseMove]);

  // ── ACCIONES ────────────────────────────────────────────────────────
  const eliminarSilla = (id) => {
    setSillas(prev => prev.filter(s => s.id !== id));
    setSelected(null);
  };

  const toggleEstado = (id) => {
    setSillas(prev => prev.map(s => {
      if (s.id !== id) return s;
      const ciclo = { general: 'vip', vip: 'inhabilitado', inhabilitado: 'general' };
      return { ...s, estado: ciclo[s.estado] || 'general' };
    }));
  };

  const updateNum = (id, num) => {
    setSillas(prev => prev.map(s => s.id === id ? { ...s, num } : s));
    setEditingNum(num);
  };

  const limpiarTodo = () => {
    if (!confirm('¿Limpiar todo el croquis?')) return;
    setSillas([]);
    setEscenario({ x: 160, y: 40, w: 200, h: 80, forma: formaEsc });
    setNextNum(1);
    setSelected(null);
  };

  const agregarFila = () => {
    const filaY = sillas.length > 0 ? Math.max(...sillas.map(s => s.y)) + GRID + 10 : 160;
    const nuevas = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: 40 + i * (GRID + 4),
      y: filaY,
      num: String(nextNum + i),
      estado: 'general',
    }));
    setSillas(prev => [...prev, ...nuevas]);
    setNextNum(n => n + 8);
  };

  const sillaSel = sillas.find(s => s.id === selected);

  const colorSilla = (estado) => ({
    general:      { bg: '#e0f2fe', border: '#299FE3', text: '#0369a1' },
    vip:          { bg: '#fef9c3', border: '#ca8a04', text: '#92400e' },
    inhabilitado: { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' },
  }[estado] || { bg: '#e0f2fe', border: '#299FE3', text: '#0369a1' });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
        {/* Herramientas */}
        <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-200">
          <button type="button" onClick={() => setTool('select')}
            className={clsx('px-3 py-1.5 rounded-md text-xs font-heading font-bold transition-all',
              tool === 'select' ? 'bg-azul text-white' : 'text-gray-600 hover:bg-gray-100')}>
            ↖ Seleccionar
          </button>
          <button type="button" onClick={() => setTool('add')}
            className={clsx('px-3 py-1.5 rounded-md text-xs font-heading font-bold transition-all',
              tool === 'add' ? 'bg-azul text-white' : 'text-gray-600 hover:bg-gray-100')}>
            + Agregar silla
          </button>
        </div>

        {/* Forma escenario */}
        <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-200">
          {FORMAS_ESCENARIO.map(({ id, label, icon }) => (
            <button key={id} type="button"
              onClick={() => { setFormaEsc(id); setEscenario(prev => ({ ...prev, forma: id })); }}
              title={label}
              className={clsx('p-1.5 rounded-md transition-all',
                formaEsc === id ? 'bg-azul text-white' : 'text-gray-500 hover:bg-gray-100')}>
              {icon}
            </button>
          ))}
        </div>

        {/* Tamaño escenario */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 font-heading">Escenario:</span>
          <input type="number" value={escenario.w} min={80} max={400} step={GRID}
            onChange={e => setEscenario(prev => ({ ...prev, w: Number(e.target.value) }))}
            className="w-16 text-xs border border-gray-200 rounded-lg px-2 py-1 text-center" />
          <span className="text-xs text-gray-400">×</span>
          <input type="number" value={escenario.h} min={40} max={200} step={GRID}
            onChange={e => setEscenario(prev => ({ ...prev, h: Number(e.target.value) }))}
            className="w-16 text-xs border border-gray-200 rounded-lg px-2 py-1 text-center" />
        </div>

        <div className="flex gap-1 ml-auto">
          <button type="button" onClick={agregarFila}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan/10 text-cyan hover:bg-cyan/20 text-xs font-heading font-bold transition-colors">
            <Plus size={12} /> Fila
          </button>
          <button type="button" onClick={limpiarTodo}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs font-heading font-bold transition-colors">
            <RotateCcw size={12} /> Limpiar
          </button>
        </div>
      </div>

      {/* Panel silla seleccionada */}
      {sillaSel && (
        <div className="flex items-center gap-3 p-3 bg-azul/5 border border-azul/20 rounded-xl">
          <span className="text-xs font-heading font-bold text-gray-700">Silla seleccionada:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Número:</span>
            <input type="text" value={editingNum} onChange={e => updateNum(sillaSel.id, e.target.value)}
              className="w-16 text-xs border border-azul/30 rounded-lg px-2 py-1 text-center font-heading font-bold" />
          </div>
          <button type="button" onClick={() => toggleEstado(sillaSel.id)}
            className={clsx('px-3 py-1 rounded-lg text-xs font-heading font-bold transition-colors',
              sillaSel.estado === 'general'      ? 'bg-cyan/20 text-cyan' :
              sillaSel.estado === 'vip'          ? 'bg-yellow-100 text-yellow-700' :
                                                   'bg-gray-100 text-gray-500')}>
            {sillaSel.estado === 'general' ? '⚪ General' : sillaSel.estado === 'vip' ? '⭐ VIP' : '🚫 Inhabilitado'}
          </button>
          <button type="button" onClick={() => eliminarSilla(sillaSel.id)}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs font-heading font-bold transition-colors ml-auto">
            <Trash2 size={12} /> Eliminar
          </button>
        </div>
      )}

      {/* Canvas */}
      <div className="border-2 border-gray-200 rounded-xl overflow-auto bg-white"
           style={{ maxHeight: 520 }}>
        <div
          ref={canvasRef}
          style={{
            position: 'relative',
            width:  Math.max(600, ...sillas.map(s => s.x + GRID + 20), escenario.x + escenario.w + 20),
            height: Math.max(480, ...sillas.map(s => s.y + GRID + 20), escenario.y + escenario.h + 20),
            backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
            backgroundSize: `${GRID}px ${GRID}px`,
            cursor: tool === 'add' ? 'crosshair' : 'default',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          {/* Escenario */}
          <div
            style={{
              position: 'absolute',
              left: escenario.x,
              top:  escenario.y,
              width:  escenario.w,
              height: escenario.h,
              cursor: 'grab',
              zIndex: 10,
            }}
          >
            <EscenarioShape forma={formaEsc} w={escenario.w} h={escenario.h} />
          </div>

          {/* Sillas */}
          {sillas.map(s => {
            const col = colorSilla(s.estado);
            const isSel = s.id === selected;
            return (
              <div key={s.id}
                style={{
                  position: 'absolute',
                  left: s.x,
                  top:  s.y,
                  width:  GRID - 4,
                  height: GRID - 4,
                  background: col.bg,
                  border: `2px solid ${isSel ? '#3333CC' : col.border}`,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontFamily: '"Bebas Neue", sans-serif',
                  color: col.text,
                  cursor: tool === 'select' ? 'grab' : 'crosshair',
                  zIndex: isSel ? 20 : 5,
                  boxShadow: isSel ? '0 0 0 3px rgba(51,51,204,0.3)' : 'none',
                  transition: 'box-shadow 0.15s',
                  userSelect: 'none',
                }}>
                {s.num}
              </div>
            );
          })}
        </div>
      </div>

      {/* Leyenda y conteo */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded border-2 border-cyan bg-cyan/20 inline-block" /> General
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded border-2 border-yellow-500 bg-yellow-100 inline-block" /> VIP
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded border-2 border-gray-400 bg-gray-100 inline-block" /> Inhabilitado
          </span>
        </div>
        <span className="font-heading font-bold text-gray-700">
          {sillas.filter(s => s.estado !== 'inhabilitado').length} sillas activas ·{' '}
          {sillas.filter(s => s.estado === 'vip').length} VIP ·{' '}
          {sillas.filter(s => s.estado === 'inhabilitado').length} inhabilitadas
        </span>
      </div>

      <p className="text-xs text-gray-400 font-heading">
        💡 Arrastra sillas y el escenario libremente · Clic en silla para seleccionar y editar · Usa "Agregar silla" para colocar una nueva
      </p>
    </div>
  );
}
