// src/pages/admin/CroquisEditorPage.jsx
// Página completa de edición del croquis de asientos
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ArrowLeft, Plus, Trash2, RotateCcw, Square, Circle, Hexagon, Triangle, Save, ZoomIn, ZoomOut } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const GRID = 44;

const FORMAS_ESCENARIO = [
  { id: 'rect',  label: 'Rectangular', icon: <Square size={15} /> },
  { id: 'round', label: 'Ovalado',     icon: <Circle size={15} /> },
  { id: 'hex',   label: 'Hexagonal',   icon: <Hexagon size={15} /> },
  { id: 'tri',   label: 'Triangular',  icon: <Triangle size={15} /> },
];

function snapToGrid(v) {
  return Math.round(v / GRID) * GRID;
}

function EscenarioShape({ forma, w, h }) {
  const base = {
    width: w, height: h,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #3333CC, #299FE3)',
    color: 'white', fontFamily: '"Bebas Neue", sans-serif',
    fontSize: 15, letterSpacing: 3,
    boxShadow: '0 6px 24px rgba(51,51,204,0.35)',
    userSelect: 'none',
  };
  if (forma === 'round') return <div style={{ ...base, borderRadius: '50%' }}>ESCENARIO</div>;
  if (forma === 'hex')   return <div style={{ ...base, borderRadius: 12, clipPath: 'polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)' }}>ESCENARIO</div>;
  if (forma === 'tri')   return <div style={{ ...base, clipPath: 'polygon(50% 0%,100% 100%,0% 100%)', borderRadius: 0 }}><span style={{ marginTop: 28 }}>ESC</span></div>;
  return <div style={{ ...base, borderRadius: 14 }}>ESCENARIO</div>;
}

export default function CroquisEditorPage() {
  const { obraId } = useParams();
  const navigate   = useNavigate();

  const [obra,       setObra]       = useState(null);
  const [sillas,     setSillas]     = useState([]);
  const [escenario,  setEscenario]  = useState({ x: 180, y: 50, w: 220, h: 90, forma: 'rect' });
  const [tool,       setTool]       = useState('select');
  const [selected,   setSelected]   = useState(null);
  const [editNum,    setEditNum]     = useState('');
  const [guardando,  setGuardando]  = useState(false);
  const [cargando,   setCargando]   = useState(true);
  const [zoom,       setZoom]       = useState(1);
  const [nextNum,    setNextNum]    = useState(1);

  const canvasRef  = useRef(null);
  const dragging   = useRef(null);

  // Cargar obra
  useEffect(() => {
    if (!obraId) return;
    getDoc(doc(db, 'obras', obraId)).then(snap => {
      if (!snap.exists()) { navigate('/admin/cartelera'); return; }
      const data = snap.data();
      setObra({ id: obraId, ...data });
      const lc = data.layoutConfig || {};
      if (lc.sillas?.length > 0) {
        setSillas(lc.sillas);
        setEscenario(lc.escenario || { x: 180, y: 50, w: 220, h: 90, forma: 'rect' });
        const maxNum = Math.max(...lc.sillas.map(s => parseInt(s.num) || 0));
        setNextNum(maxNum + 1);
      }
      setCargando(false);
    });
  }, [obraId]);

  // ── MOUSE DOWN ────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / zoom;
    const my = (e.clientY - rect.top)  / zoom;

    if (tool === 'add') {
      const x = snapToGrid(mx - GRID / 2);
      const y = snapToGrid(my - GRID / 2);
      const nueva = { id: Date.now(), x: Math.max(0,x), y: Math.max(0,y), num: String(nextNum), estado: 'general' };
      setSillas(prev => [...prev, nueva]);
      setNextNum(n => n + 1);
      setSelected(nueva.id);
      setEditNum(String(nextNum));
      return;
    }

    // Click en escenario
    if (mx >= escenario.x && mx <= escenario.x + escenario.w &&
        my >= escenario.y && my <= escenario.y + escenario.h) {
      dragging.current = { type: 'escenario', offsetX: mx - escenario.x, offsetY: my - escenario.y };
      setSelected(null);
      return;
    }

    // Click en silla
    for (const s of [...sillas].reverse()) {
      if (mx >= s.x && mx <= s.x + GRID - 4 && my >= s.y && my <= s.y + GRID - 4) {
        dragging.current = { type: 'silla', id: s.id, offsetX: mx - s.x, offsetY: my - s.y };
        setSelected(s.id);
        setEditNum(s.num);
        return;
      }
    }
    setSelected(null);
  }, [tool, sillas, escenario, zoom, nextNum]);

  // ── MOUSE MOVE ────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / zoom;
    const my = (e.clientY - rect.top)  / zoom;

    if (dragging.current.type === 'escenario') {
      setEscenario(prev => ({
        ...prev,
        x: Math.max(0, snapToGrid(mx - dragging.current.offsetX)),
        y: Math.max(0, snapToGrid(my - dragging.current.offsetY)),
      }));
    } else {
      setSillas(prev => prev.map(s =>
        s.id === dragging.current.id
          ? { ...s, x: Math.max(0, snapToGrid(mx - dragging.current.offsetX)), y: Math.max(0, snapToGrid(my - dragging.current.offsetY)) }
          : s
      ));
    }
  }, [zoom]);

  const handleMouseUp = useCallback(() => { dragging.current = null; }, []);

  // ── ACCIONES ──────────────────────────────────────────────────────────
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
    setEditNum(num);
  };

  const agregarFila = () => {
    const yBase = sillas.length > 0 ? Math.max(...sillas.map(s => s.y)) + GRID + 8 : 200;
    const nuevas = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: 40 + i * (GRID + 4),
      y: yBase,
      num: String(nextNum + i),
      estado: 'general',
    }));
    setSillas(prev => [...prev, ...nuevas]);
    setNextNum(n => n + 8);
  };

  const limpiar = () => {
    if (!confirm('¿Limpiar todo el croquis?')) return;
    setSillas([]); setNextNum(1); setSelected(null);
    setEscenario({ x: 180, y: 50, w: 220, h: 90, forma: 'rect' });
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      await updateDoc(doc(db, 'obras', obraId), {
        layoutConfig: { sillas, escenario },
        actualizadoEn: serverTimestamp(),
      });
      toast.success('Croquis guardado');
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  // Dimensiones dinámicas del canvas
  const canvasW = Math.max(800, ...sillas.map(s => s.x + GRID + 40), escenario.x + escenario.w + 40);
  const canvasH = Math.max(600, ...sillas.map(s => s.y + GRID + 40), escenario.y + escenario.h + 40);

  const sillaSel = sillas.find(s => s.id === selected);

  const colorSilla = (estado) => ({
    general:      { bg: '#e0f2fe', border: '#299FE3', text: '#0369a1' },
    vip:          { bg: '#fef9c3', border: '#ca8a04', text: '#92400e' },
    inhabilitado: { bg: '#f3f4f6', border: '#d1d5db', text: '#9ca3af' },
  }[estado] || { bg: '#e0f2fe', border: '#299FE3', text: '#0369a1' });

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="spinner w-10 h-10" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 sticky top-0 z-30">
        <button onClick={() => navigate('/admin/cartelera')}
          className="flex items-center gap-2 text-gray-500 hover:text-azul transition-colors font-heading font-bold text-sm">
          <ArrowLeft size={18} /> Volver
        </button>
        <div className="flex-1">
          <h1 className="font-heading font-bold text-gray-900">Editor de croquis</h1>
          <p className="text-xs text-gray-400">{obra?.nombre}</p>
        </div>
        <button onClick={guardar} disabled={guardando}
          className="flex items-center gap-2 px-5 py-2.5 bg-azul text-white rounded-xl font-heading font-bold text-sm hover:bg-azul/90 transition-colors disabled:opacity-60">
          {guardando ? <span className="spinner w-4 h-4" /> : <Save size={16} />}
          Guardar croquis
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── PANEL IZQUIERDO ──────────────────────────────────────── */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col overflow-y-auto flex-shrink-0">

          {/* Herramientas */}
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wide mb-3">Herramienta</p>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => setTool('select')}
                className={clsx('flex items-center gap-3 px-4 py-3 rounded-xl font-heading font-bold text-sm transition-all',
                  tool === 'select' ? 'bg-azul text-white shadow-sm' : 'bg-gray-50 text-gray-700 hover:bg-gray-100')}>
                ↖ Seleccionar / Mover
              </button>
              <button type="button" onClick={() => setTool('add')}
                className={clsx('flex items-center gap-3 px-4 py-3 rounded-xl font-heading font-bold text-sm transition-all',
                  tool === 'add' ? 'bg-azul text-white shadow-sm' : 'bg-gray-50 text-gray-700 hover:bg-gray-100')}>
                <Plus size={16} /> Agregar silla
              </button>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wide mb-3">Acciones</p>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={agregarFila}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan/10 text-cyan hover:bg-cyan/20 text-sm font-heading font-bold transition-colors">
                <Plus size={14} /> Agregar fila (8 sillas)
              </button>
              <button type="button" onClick={limpiar}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 text-sm font-heading font-bold transition-colors">
                <RotateCcw size={14} /> Limpiar todo
              </button>
            </div>
          </div>

          {/* Escenario */}
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wide mb-3">Escenario</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {FORMAS_ESCENARIO.map(({ id, label, icon }) => (
                <button key={id} type="button"
                  onClick={() => setEscenario(prev => ({ ...prev, forma: id }))}
                  className={clsx('flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-heading font-bold border-2 transition-all',
                    escenario.forma === id ? 'border-azul bg-azul text-white' : 'border-gray-200 text-gray-600 hover:border-azul hover:text-azul')}>
                  {icon} {label}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-500 font-heading">Ancho (px)</label>
                <input type="number" value={escenario.w} min={80} max={500} step={GRID}
                  onChange={e => setEscenario(prev => ({ ...prev, w: Number(e.target.value) }))}
                  className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-heading">Alto (px)</label>
                <input type="number" value={escenario.h} min={40} max={300} step={GRID}
                  onChange={e => setEscenario(prev => ({ ...prev, h: Number(e.target.value) }))}
                  className="w-full mt-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5" />
              </div>
            </div>
          </div>

          {/* Silla seleccionada */}
          {sillaSel && (
            <div className="p-4 border-b border-gray-100 bg-azul/3">
              <p className="text-xs font-heading font-bold text-azul uppercase tracking-wide mb-3">Silla seleccionada</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 font-heading">Número</label>
                  <input type="text" value={editNum}
                    onChange={e => updateNum(sillaSel.id, e.target.value)}
                    className="w-full mt-1 text-sm border border-azul/30 rounded-lg px-3 py-1.5 font-heading font-bold text-center" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-heading mb-1 block">Estado</label>
                  <div className="flex flex-col gap-1.5">
                    {['general', 'vip', 'inhabilitado'].map(est => (
                      <button key={est} type="button"
                        onClick={() => setSillas(prev => prev.map(s => s.id === sillaSel.id ? { ...s, estado: est } : s))}
                        className={clsx('px-3 py-2 rounded-lg text-xs font-heading font-bold border-2 transition-all text-left',
                          sillaSel.estado === est
                            ? est === 'general'      ? 'border-cyan bg-cyan/10 text-cyan'
                            : est === 'vip'          ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                            :                          'border-gray-400 bg-gray-100 text-gray-600'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300')}>
                        {est === 'general' ? '⚪ General' : est === 'vip' ? '⭐ VIP Premium' : '🚫 Inhabilitado'}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={() => eliminarSilla(sillaSel.id)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs font-heading font-bold transition-colors">
                  <Trash2 size={13} /> Eliminar silla
                </button>
              </div>
            </div>
          )}

          {/* Estadísticas */}
          <div className="p-4 mt-auto">
            <p className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wide mb-2">Resumen</p>
            <div className="space-y-1 text-xs text-gray-600 font-heading">
              <div className="flex justify-between"><span>Total sillas:</span><strong>{sillas.length}</strong></div>
              <div className="flex justify-between"><span>Generales:</span><strong className="text-cyan">{sillas.filter(s => s.estado === 'general').length}</strong></div>
              <div className="flex justify-between"><span>VIP:</span><strong className="text-yellow-600">{sillas.filter(s => s.estado === 'vip').length}</strong></div>
              <div className="flex justify-between"><span>Inhabilitadas:</span><strong className="text-gray-400">{sillas.filter(s => s.estado === 'inhabilitado').length}</strong></div>
              <div className="flex justify-between border-t border-gray-100 pt-1 mt-1"><span>Disponibles:</span><strong className="text-azul">{sillas.filter(s => s.estado !== 'inhabilitado').length}</strong></div>
            </div>
          </div>
        </div>

        {/* ── CANVAS ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto relative bg-gray-100">

          {/* Zoom controls */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-1 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))}
              className="p-2.5 hover:bg-gray-50 transition-colors text-gray-600 hover:text-azul">
              <ZoomIn size={16} />
            </button>
            <div className="px-3 py-1 text-xs font-heading font-bold text-gray-500 text-center border-t border-b border-gray-100">
              {Math.round(zoom * 100)}%
            </div>
            <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}
              className="p-2.5 hover:bg-gray-50 transition-colors text-gray-600 hover:text-azul">
              <ZoomOut size={16} />
            </button>
          </div>

          {/* Instrucciones */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-md border border-gray-200 text-xs text-gray-500 font-heading whitespace-nowrap">
            {tool === 'add'
              ? '✨ Clic en el canvas para colocar una silla'
              : '↖ Arrastra sillas y el escenario · Clic en silla para seleccionar'}
          </div>

          <div
            ref={canvasRef}
            style={{
              width:  canvasW * zoom,
              height: canvasH * zoom,
              position: 'relative',
              transformOrigin: '0 0',
              cursor: tool === 'add' ? 'crosshair' : 'default',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Grid interno */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
              backgroundSize: `${GRID * zoom}px ${GRID * zoom}px`,
              pointerEvents: 'none',
            }} />

            {/* Escenario */}
            <div style={{
              position: 'absolute',
              left: escenario.x * zoom,
              top:  escenario.y * zoom,
              width:  escenario.w * zoom,
              height: escenario.h * zoom,
              cursor: 'grab',
              zIndex: 10,
            }}>
              <EscenarioShape forma={escenario.forma} w={escenario.w * zoom} h={escenario.h * zoom} />
            </div>

            {/* Sillas */}
            {sillas.map(s => {
              const col    = colorSilla(s.estado);
              const isSel  = s.id === selected;
              const size   = (GRID - 6) * zoom;
              return (
                <div key={s.id}
                  style={{
                    position: 'absolute',
                    left:   s.x * zoom,
                    top:    s.y * zoom,
                    width:  size,
                    height: size,
                    background: col.bg,
                    border: `2px solid ${isSel ? '#3333CC' : col.border}`,
                    borderRadius: 8 * zoom,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: Math.max(9, 12 * zoom),
                    fontFamily: '"Bebas Neue", sans-serif',
                    color: isSel ? '#3333CC' : col.text,
                    cursor: tool === 'select' ? 'grab' : 'crosshair',
                    zIndex: isSel ? 20 : 5,
                    boxShadow: isSel ? '0 0 0 3px rgba(51,51,204,0.25)' : 'none',
                    transition: 'box-shadow 0.15s',
                    userSelect: 'none',
                    fontWeight: isSel ? 'bold' : 'normal',
                  }}>
                  {s.num}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
