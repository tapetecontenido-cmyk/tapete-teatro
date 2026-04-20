// src/components/admin/CroquisEditor.jsx
import { useState, useRef, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';
import { Plus, Trash2, RotateCcw, Square, Circle, Triangle, Hexagon } from 'lucide-react';

const FORMAS_ESCENARIO = [
  { id: 'rect',  label: 'Rect',   icon: <Square size={12} /> },
  { id: 'round', label: 'Oval',   icon: <Circle size={12} /> },
  { id: 'hex',   label: 'Hex',    icon: <Hexagon size={12} /> },
  { id: 'tri',   label: 'Tri',    icon: <Triangle size={12} /> },
];

const GRID = 32;

function snap(v) { return Math.round(v / GRID) * GRID; }

function EscenarioShape({ forma, w, h }) {
  const base = {
    width: w, height: h,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg,#3333CC,#299FE3)',
    color: 'white', fontFamily: '"Bebas Neue",sans-serif',
    fontSize: 11, letterSpacing: 2, userSelect: 'none',
    boxShadow: '0 3px 12px rgba(51,51,204,0.35)',
  };
  if (forma === 'round') return <div style={{ ...base, borderRadius: '50%' }}>ESC</div>;
  if (forma === 'hex')   return <div style={{ ...base, borderRadius: 8, clipPath: 'polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)' }}>ESC</div>;
  if (forma === 'tri')   return <div style={{ ...base, clipPath: 'polygon(50% 0%,100% 100%,0% 100%)', borderRadius: 0 }}><span style={{ marginTop: 20, fontSize: 9 }}>ESC</span></div>;
  return <div style={{ ...base, borderRadius: 8 }}>ESCENARIO</div>;
}

export default function CroquisEditor({ config, onChange }) {
  const canvasRef = useRef(null);
  const dragging  = useRef(null);

  const [sillas,   setSillas]   = useState(() => config?.sillas   || []);
  const [escenario, setEscenario] = useState(() => config?.escenario || { x: 80, y: 20, w: 160, h: 56, forma: 'rect' });
  const [tool,     setTool]     = useState('select');
  const [selected, setSelected] = useState(null);
  const [editNum,  setEditNum]  = useState('');
  const [nextNum,  setNextNum]  = useState(() => {
    const nums = (config?.sillas || []).map(s => parseInt(s.num) || 0);
    return nums.length > 0 ? Math.max(...nums) + 1 : 1;
  });

  useEffect(() => {
    onChange?.({ ...config, sillas, escenario });
  }, [sillas, escenario]);

  const handleMouseDown = useCallback((e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (tool === 'add') {
      const nueva = { id: Date.now(), x: Math.max(0, snap(mx - GRID/2)), y: Math.max(0, snap(my - GRID/2)), num: String(nextNum), estado: 'general' };
      setSillas(prev => [...prev, nueva]);
      setNextNum(n => n + 1);
      setSelected(nueva.id);
      setEditNum(String(nextNum));
      return;
    }

    // Click en escenario
    if (mx >= escenario.x && mx <= escenario.x + escenario.w && my >= escenario.y && my <= escenario.y + escenario.h) {
      dragging.current = { type: 'escenario', offsetX: mx - escenario.x, offsetY: my - escenario.y };
      setSelected(null);
      return;
    }

    // Click en silla
    for (const s of [...sillas].reverse()) {
      if (mx >= s.x && mx <= s.x + GRID - 2 && my >= s.y && my <= s.y + GRID - 2) {
        dragging.current = { type: 'silla', id: s.id, offsetX: mx - s.x, offsetY: my - s.y };
        setSelected(s.id);
        setEditNum(s.num);
        return;
      }
    }
    setSelected(null);
  }, [tool, sillas, escenario, nextNum]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (dragging.current.type === 'escenario') {
      setEscenario(prev => ({ ...prev, x: Math.max(0, snap(mx - dragging.current.offsetX)), y: Math.max(0, snap(my - dragging.current.offsetY)) }));
    } else {
      setSillas(prev => prev.map(s => s.id === dragging.current.id
        ? { ...s, x: Math.max(0, snap(mx - dragging.current.offsetX)), y: Math.max(0, snap(my - dragging.current.offsetY)) }
        : s
      ));
    }
  }, []);

  const handleMouseUp = useCallback(() => { dragging.current = null; }, []);

  const eliminarSilla = (id) => { setSillas(prev => prev.filter(s => s.id !== id)); setSelected(null); };

  const toggleEstado = (id) => {
    setSillas(prev => prev.map(s => {
      if (s.id !== id) return s;
      const ciclo = { general: 'vip', vip: 'inhabilitado', inhabilitado: 'general' };
      return { ...s, estado: ciclo[s.estado] || 'general' };
    }));
  };

  const agregarFila = () => {
    const filaY = sillas.length > 0 ? Math.max(...sillas.map(s => s.y)) + GRID + 6 : 120;
    const nuevas = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i, x: 20 + i * (GRID + 4), y: filaY, num: String(nextNum + i), estado: 'general',
    }));
    setSillas(prev => [...prev, ...nuevas]);
    setNextNum(n => n + 6);
  };

  const limpiar = () => {
    if (!confirm('¿Limpiar todo?')) return;
    setSillas([]); setNextNum(1); setSelected(null);
    setEscenario({ x: 80, y: 20, w: 160, h: 56, forma: escenario.forma });
  };

  const sillaSel = sillas.find(s => s.id === selected);

  const colorSilla = (estado) => ({
    general:      { bg: '#e0f2fe', border: '#299FE3', text: '#0369a1' },
    vip:          { bg: '#fef9c3', border: '#ca8a04', text: '#92400e' },
    inhabilitado: { bg: '#f3f4f6', border: '#d1d5db', text: '#9ca3af' },
  }[estado] || { bg: '#e0f2fe', border: '#299FE3', text: '#0369a1' });

  const canvasW = Math.max(500, ...sillas.map(s => s.x + GRID + 16), escenario.x + escenario.w + 16);
  const canvasH = Math.max(320, ...sillas.map(s => s.y + GRID + 16), escenario.y + escenario.h + 16);

  return (
    <div className="space-y-3">

      {/* Toolbar compacta */}
      <div className="flex flex-wrap gap-2 items-center p-2 bg-gray-50 rounded-lg border border-gray-200">
        {/* Herramienta */}
        <div className="flex gap-1 bg-white rounded-md p-0.5 border border-gray-200">
          <button type="button" onClick={() => setTool('select')}
            className={clsx('px-2 py-1 rounded text-xs font-heading font-bold transition-all',
              tool === 'select' ? 'bg-azul text-white' : 'text-gray-600 hover:bg-gray-100')}>
            ↖ Mover
          </button>
          <button type="button" onClick={() => setTool('add')}
            className={clsx('px-2 py-1 rounded text-xs font-heading font-bold transition-all',
              tool === 'add' ? 'bg-azul text-white' : 'text-gray-600 hover:bg-gray-100')}>
            + Silla
          </button>
        </div>

        {/* Forma escenario */}
        <div className="flex gap-0.5 bg-white rounded-md p-0.5 border border-gray-200">
          {FORMAS_ESCENARIO.map(({ id, label, icon }) => (
            <button key={id} type="button" title={label}
              onClick={() => setEscenario(prev => ({ ...prev, forma: id }))}
              className={clsx('p-1.5 rounded transition-all',
                escenario.forma === id ? 'bg-azul text-white' : 'text-gray-500 hover:bg-gray-100')}>
              {icon}
            </button>
          ))}
        </div>

        {/* Tamaño escenario */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400 font-heading">W</span>
          <input type="number" value={escenario.w} min={64} max={320} step={GRID}
            onChange={e => setEscenario(prev => ({ ...prev, w: Number(e.target.value) }))}
            className="w-14 text-xs border border-gray-200 rounded px-1.5 py-1 text-center" />
          <span className="text-xs text-gray-400">×</span>
          <span className="text-xs text-gray-400 font-heading">H</span>
          <input type="number" value={escenario.h} min={32} max={200} step={GRID}
            onChange={e => setEscenario(prev => ({ ...prev, h: Number(e.target.value) }))}
            className="w-14 text-xs border border-gray-200 rounded px-1.5 py-1 text-center" />
        </div>

        <div className="flex gap-1 ml-auto">
          <button type="button" onClick={agregarFila}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan/10 text-cyan hover:bg-cyan/20 text-xs font-heading font-bold transition-colors">
            <Plus size={11} /> Fila
          </button>
          <button type="button" onClick={limpiar}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 text-xs font-heading font-bold transition-colors">
            <RotateCcw size={11} /> Limpiar
          </button>
        </div>
      </div>

      {/* Panel silla seleccionada — siempre visible arriba del canvas */}
      {sillaSel ? (
        <div className="flex flex-wrap items-center gap-2 p-2.5 bg-azul/5 border border-azul/20 rounded-lg">
          <span className="text-xs font-heading font-bold text-azul">Silla {sillaSel.num}:</span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">#</span>
            <input type="text" value={editNum}
              onChange={e => { setSillas(prev => prev.map(s => s.id === sillaSel.id ? { ...s, num: e.target.value } : s)); setEditNum(e.target.value); }}
              className="w-14 text-xs border border-azul/30 rounded px-2 py-1 text-center font-heading font-bold" />
          </div>
          <button type="button" onClick={() => toggleEstado(sillaSel.id)}
            className={clsx('px-2 py-1 rounded text-xs font-heading font-bold transition-colors',
              sillaSel.estado === 'general' ? 'bg-cyan/20 text-cyan' :
              sillaSel.estado === 'vip'     ? 'bg-yellow-100 text-yellow-700' :
                                              'bg-gray-100 text-gray-500')}>
            {sillaSel.estado === 'general' ? '⚪ General' : sillaSel.estado === 'vip' ? '⭐ VIP' : '🚫 Inh.'}
          </button>
          <button type="button" onClick={() => eliminarSilla(sillaSel.id)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-500 hover:bg-red-100 text-xs font-heading font-bold transition-colors ml-auto">
            <Trash2 size={11} /> Eliminar
          </button>
        </div>
      ) : (
        <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-400 font-heading">
            {tool === 'add' ? '✨ Clic en el canvas para colocar una silla' : '↖ Clic en una silla para seleccionarla · Arrastra para mover'}
          </p>
        </div>
      )}

      {/* Canvas con scroll */}
      <div className="border border-gray-200 rounded-xl overflow-auto bg-white" style={{ maxHeight: 380, maxWidth: '100%' }}>
        <div
          ref={canvasRef}
          style={{
            position: 'relative',
            width:  canvasW,
            height: canvasH,
            backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
            backgroundSize:  `${GRID}px ${GRID}px`,
            cursor: tool === 'add' ? 'crosshair' : 'default',
            flexShrink: 0,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Escenario */}
          <div style={{ position: 'absolute', left: escenario.x, top: escenario.y, width: escenario.w, height: escenario.h, cursor: 'grab', zIndex: 10 }}>
            <EscenarioShape forma={escenario.forma} w={escenario.w} h={escenario.h} />
          </div>

          {/* Sillas */}
          {sillas.map(s => {
            const col   = colorSilla(s.estado);
            const isSel = s.id === selected;
            return (
              <div key={s.id} style={{
                position: 'absolute', left: s.x, top: s.y,
                width: GRID - 4, height: GRID - 4,
                background: col.bg,
                border: `2px solid ${isSel ? '#3333CC' : col.border}`,
                borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontFamily: '"Bebas Neue",sans-serif', color: col.text,
                cursor: tool === 'select' ? 'grab' : 'crosshair',
                zIndex: isSel ? 20 : 5,
                boxShadow: isSel ? '0 0 0 3px rgba(51,51,204,0.25)' : 'none',
                userSelect: 'none',
              }}>
                {s.num}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 font-heading">
        <div className="flex gap-3">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-cyan bg-cyan/20 inline-block" /> General</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-yellow-500 bg-yellow-100 inline-block" /> VIP</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-gray-300 bg-gray-100 inline-block" /> Inh.</span>
        </div>
        <span className="font-bold text-gray-700">
          {sillas.filter(s => s.estado !== 'inhabilitado').length} activas · {sillas.filter(s => s.estado === 'vip').length} VIP
        </span>
      </div>
    </div>
  );
}
