// src/pages/admin/AdminCartelera.jsx
import { useState, useEffect } from 'react';
import {
  collection, query, orderBy, onSnapshot, doc,
  updateDoc, serverTimestamp, addDoc, getDocs, deleteDoc
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Plus, Edit2, Trash2, X, Upload, CheckCircle, Calendar, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import { subirArchivo } from '../../utils/subirArchivo';

const GENEROS = ['Drama', 'Comedia', 'Musical', 'Infantil', 'Danza', 'Monólogo', 'Experimental'];
const POSICIONES_ESCENARIO = [
  { val: 'arriba',    label: '↑ Arriba' },
  { val: 'abajo',     label: '↓ Abajo' },
  { val: 'izquierda', label: '← Izquierda' },
  { val: 'derecha',   label: '→ Derecha' },
  { val: 'centro',    label: '⊞ Centro' },
];

// ── Vista previa del croquis ───────────────────────────────────────────
function VistaPrevia({ config, onToggleAsiento }) {
  const {
    totalSillas       = 30,
    filas             = 5,
    posicionEscenario = 'arriba',
    vipAsientos       = [],
    inhabilitados     = [],
  } = config;

  const getSeatClass = (seatId) => {
    if (inhabilitados.includes(seatId)) return 'bg-gray-300 border-gray-400';
    if (vipAsientos.includes(seatId))   return 'bg-yellow-400 border-yellow-500';
    return 'bg-cyan/30 border-cyan';
  };

  const Seat = ({ seatId }) => (
    <button type="button" onClick={() => onToggleAsiento(seatId)}
      title={`Asiento ${seatId} — clic para cambiar estado`}
      className={clsx('w-6 h-6 rounded border transition-all hover:opacity-70 text-xs', getSeatClass(seatId))}>
      {seatId}
    </button>
  );

  const Escenario = ({ className = '' }) => (
    <div className={clsx('bg-gradient-brand text-white text-center text-xs font-heading font-bold py-2 px-4 rounded-lg', className)}>
      ESCENARIO
    </div>
  );

  const cols = Math.ceil(totalSillas / filas);

  const generarFilas = (numFilas, colsPorFila, offset = 0) =>
    Array.from({ length: numFilas }, (_, fi) => (
      <div key={fi} className="flex gap-1 flex-wrap justify-center">
        {Array.from({ length: colsPorFila }, (_, ci) => {
          const seatId = String(fi * colsPorFila + ci + 1 + offset);
          return <Seat key={seatId} seatId={seatId} />;
        })}
      </div>
    ));

  if (posicionEscenario === 'arriba') return (
    <div className="flex flex-col gap-3 items-center w-full">
      <Escenario className="w-3/4" />
      <div className="flex flex-col gap-1 w-full">{generarFilas(filas, cols)}</div>
    </div>
  );

  if (posicionEscenario === 'abajo') return (
    <div className="flex flex-col gap-3 items-center w-full">
      <div className="flex flex-col gap-1 w-full">{generarFilas(filas, cols)}</div>
      <Escenario className="w-3/4" />
    </div>
  );

  if (posicionEscenario === 'izquierda') return (
    <div className="flex gap-4 items-center">
      <Escenario className="h-24 flex items-center justify-center px-2 py-4 flex-shrink-0" />
      <div className="flex flex-col gap-1">{generarFilas(filas, cols)}</div>
    </div>
  );

  if (posicionEscenario === 'derecha') return (
    <div className="flex gap-4 items-center">
      <div className="flex flex-col gap-1">{generarFilas(filas, cols)}</div>
      <Escenario className="h-24 flex items-center justify-center px-2 py-4 flex-shrink-0" />
    </div>
  );

  if (posicionEscenario === 'centro') {
    const por4 = Math.floor(totalSillas / 4);
    const r    = totalSillas % 4;
    const sArr = por4 + (r > 0 ? 1 : 0);
    const sAbj = por4 + (r > 1 ? 1 : 0);
    const sIzq = por4 + (r > 2 ? 1 : 0);
    const sDer = por4;
    const startArr = 1, startIzq = startArr + sArr, startDer = startIzq + sIzq, startAbj = startDer + sDer;

    const Horiz = ({ count, start }) => (
      <div className="flex gap-1 justify-center">
        {Array.from({ length: count }, (_, i) => <Seat key={start+i} seatId={String(start+i)} />)}
      </div>
    );
    const Vert = ({ count, start }) => (
      <div className="flex flex-col gap-1">
        {Array.from({ length: count }, (_, i) => <Seat key={start+i} seatId={String(start+i)} />)}
      </div>
    );

    return (
      <div className="flex flex-col gap-2 items-center">
        <Horiz count={sArr} start={startArr} />
        <div className="flex gap-3 items-center">
          <Vert count={sIzq} start={startIzq} />
          <div className="bg-gradient-brand text-white text-center text-xs font-heading font-bold py-8 px-6 rounded-xl">ESCENARIO</div>
          <Vert count={sDer} start={startDer} />
        </div>
        <Horiz count={sAbj} start={startAbj} />
      </div>
    );
  }

  return null;
}

// ── Configurador de asientos ───────────────────────────────────────────
function ConfiguradorAsientos({ config, onChange }) {
  const {
    totalSillas       = 30,
    filas             = 5,
    posicionEscenario = 'arriba',
    vipAsientos       = [],
    inhabilitados     = [],
  } = config;

  // Loop de 3 estados: general → vip → inhabilitado → general
  const toggleEstadoAsiento = (seatId) => {
    const esVip   = vipAsientos.includes(seatId);
    const esInhab = inhabilitados.includes(seatId);

    if (!esVip && !esInhab) {
      // General → VIP
      onChange({ ...config, vipAsientos: [...vipAsientos, seatId] });
    } else if (esVip) {
      // VIP → Inhabilitado
      onChange({
        ...config,
        vipAsientos:  vipAsientos.filter(s => s !== seatId),
        inhabilitados: [...inhabilitados, seatId],
      });
    } else {
      // Inhabilitado → General
      onChange({ ...config, inhabilitados: inhabilitados.filter(s => s !== seatId) });
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-field">Total de sillas</label>
          <input type="number" min="1" max="200" value={totalSillas}
            onChange={e => onChange({ ...config, totalSillas: Number(e.target.value) })}
            className="input-field text-sm py-2" />
        </div>
        <div>
          <label className="label-field">Filas</label>
          <input type="number" min="1" max="20" value={filas}
            onChange={e => onChange({ ...config, filas: Number(e.target.value) })}
            className="input-field text-sm py-2" />
        </div>
      </div>

      <div>
        <label className="label-field mb-2">Posición del escenario</label>
        <div className="grid grid-cols-5 gap-2">
          {POSICIONES_ESCENARIO.map(({ val, label }) => (
            <button key={val} type="button"
              onClick={() => onChange({ ...config, posicionEscenario: val })}
              className={clsx(
                'py-2 px-1 rounded-xl text-xs font-heading font-bold border-2 transition-all text-center',
                posicionEscenario === val ? 'border-azul bg-azul text-white' : 'border-gray-200 text-gray-600 hover:border-azul hover:text-azul'
              )}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label-field mb-1">Vista previa</label>
        <p className="text-xs text-gray-400 mb-2">Clic 1x → VIP (amarillo) · Clic 2x → Inhabilitado (gris) · Clic 3x → General (azul)</p>
        <div className="bg-gray-50 rounded-xl p-4 overflow-x-auto min-h-32 flex items-center justify-center">
          <VistaPrevia config={config} onToggleAsiento={toggleEstadoAsiento} />
        </div>
        <div className="flex gap-4 justify-center mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-cyan/30 border border-cyan inline-block" /> General</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400 border border-yellow-500 inline-block" /> VIP</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-300 border border-gray-400 inline-block" /> Inhabilitado</span>
        </div>
      </div>
    </div>
  );
}

function ModalFunciones({ obra, onClose }) {
  const [funciones, setFunciones] = useState([]);
  const [form, setForm] = useState({ fecha: '', hora: '', sala: '' });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    getDocs(query(collection(db, 'obras', obra.id, 'funciones'), orderBy('fecha')))
      .then(snap => setFunciones(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [obra.id]);

  const agregarFuncion = async () => {
    if (!form.fecha || !form.hora) { toast.error('Fecha y hora son requeridas'); return; }
    setGuardando(true);
    try {
      const fechaObj = new Date(form.fecha + 'T' + form.hora);
      const totalSillas = obra.layoutConfig?.totalSillas || 30;
      const ref = await addDoc(collection(db, 'obras', obra.id, 'funciones'), {
        fecha: fechaObj,
        hora: form.hora,
        sala: DOMPurify.sanitize(form.sala.trim()),
        fechaTexto: fechaObj.toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        asientosDisponibles: totalSillas - (obra.layoutConfig?.inhabilitados?.length || 0),
        creadoEn: serverTimestamp(),
      });
      setFunciones(prev => [...prev, { id: ref.id, ...form, fecha: fechaObj }]);
      setForm({ fecha: '', hora: '', sala: '' });
      toast.success('Función agregada');
    } catch { toast.error('Error al agregar'); }
    finally { setGuardando(false); }
  };

  const eliminarFuncion = async (id) => {
    await deleteDoc(doc(db, 'obras', obra.id, 'funciones', id));
    setFunciones(prev => prev.filter(f => f.id !== id));
    toast.success('Función eliminada');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container max-w-xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-heading font-bold text-xl text-gray-900">Funciones — {obra.nombre}</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 mb-5">
          <p className="font-heading font-bold text-sm text-gray-700 mb-3">Nueva función</p>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label-field">Fecha</label><input type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} className="input-field text-sm py-2" /></div>
            <div><label className="label-field">Hora</label><input type="time" value={form.hora} onChange={e => setForm(p => ({ ...p, hora: e.target.value }))} className="input-field text-sm py-2" /></div>
            <div className="col-span-2"><label className="label-field">Sala (opcional)</label><input type="text" value={form.sala} onChange={e => setForm(p => ({ ...p, sala: e.target.value }))} className="input-field text-sm py-2" placeholder="Sala principal" /></div>
          </div>
          <button onClick={agregarFuncion} disabled={guardando} className="btn-primary w-full mt-3 py-2.5 text-sm gap-2">
            {guardando ? <span className="spinner w-4 h-4" /> : <><Plus size={16} /> Agregar función</>}
          </button>
        </div>
        <div className="space-y-2">
          {funciones.length === 0
            ? <p className="text-center text-gray-400 text-sm py-4 font-heading">No hay funciones aún</p>
            : funciones.map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-azul flex-shrink-0" />
                  <div>
                    <p className="font-heading font-bold text-sm text-gray-900">{f.fechaTexto || (f.fecha instanceof Date ? f.fecha.toLocaleDateString('es-VE') : 'Fecha')}</p>
                    <p className="text-xs text-gray-400">{f.hora} {f.sala && `· ${f.sala}`}</p>
                  </div>
                </div>
                <button onClick={() => eliminarFuncion(f.id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-gray-400"><Trash2 size={14} /></button>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

export default function AdminCartelera() {
  const [obras, setObras] = useState([]);
  const [modal, setModal] = useState(false);
  const [modalFunciones, setModalFunciones] = useState(null);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', genero: '', descripcion: '', director: '', reparto: '', duracion: '', precioGeneral: '', precioVip: '' });
  const [layoutConfig, setLayoutConfig] = useState({
    totalSillas: 30, filas: 5, posicionEscenario: 'arriba', vipAsientos: [], inhabilitados: []
  });
  const [poster, setPoster] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mostrarAsientos, setMostrarAsientos] = useState(false);
  const [verPapeleraObras, setVerPapeleraObras] = useState(false);
  const [papeleraObras,    setPapeleraObras]    = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'obras'), orderBy('creadoEn', 'desc')), snap => {
      setObras(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'obras'), orderBy('creadoEn', 'desc')), snap => {
      setObras(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!verPapeleraObras) return;
    const unsub = onSnapshot(
      query(collection(db, 'papeleraObras'), orderBy('eliminadaEn', 'desc')),
      snap => setPapeleraObras(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, [verPapeleraObras]);

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ nombre: '', genero: '', descripcion: '', director: '', reparto: '', duracion: '', precioGeneral: '', precioVip: '' });
    setLayoutConfig({ totalSillas: 30, filas: 5, posicionEscenario: 'arriba', vipAsientos: [], inhabilitados: [] });
    setPoster(null); setMostrarAsientos(false); setModal(true);
  };

  const abrirEditar = (obra) => {
    setEditando(obra);
    setForm({ nombre: obra.nombre, genero: obra.genero || '', descripcion: obra.descripcion || '', director: obra.director || '', reparto: obra.reparto || '', duracion: obra.duracion || '', precioGeneral: obra.precioGeneral || '', precioVip: obra.precioVip || '' });
    setLayoutConfig(obra.layoutConfig || { totalSillas: 30, filas: 5, posicionEscenario: 'arriba', vipAsientos: [], inhabilitados: [] });
    setPoster(null); setMostrarAsientos(false); setModal(true);
  };

  const handleGuardar = async () => {
    if (!form.nombre) { toast.error('El nombre es requerido'); return; }
    setGuardando(true);
    try {
      let posterUrl = editando?.posterUrl || '';
      if (poster) posterUrl = await subirArchivo(poster, 'posters');
      const data = {
        nombre: DOMPurify.sanitize(form.nombre.trim()), genero: form.genero,
        descripcion: DOMPurify.sanitize(form.descripcion.trim()), director: DOMPurify.sanitize(form.director.trim()),
        reparto: DOMPurify.sanitize(form.reparto.trim()), duracion: form.duracion,
        precioGeneral: Number(form.precioGeneral) || 0, precioVip: Number(form.precioVip) || 0,
        posterUrl, layoutConfig, activo: true, actualizadoEn: serverTimestamp(),
      };
      if (editando) { await updateDoc(doc(db, 'obras', editando.id), data); toast.success('Obra actualizada'); }
      else { await addDoc(collection(db, 'obras'), { ...data, creadoEn: serverTimestamp() }); toast.success('Obra creada'); }
      setModal(false);
    } catch (err) { toast.error('Error: ' + err.message); }
    finally { setGuardando(false); }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Desactivar esta obra?')) return;
    await updateDoc(doc(db, 'obras', id), { activo: false });
    toast.success('Obra desactivada');
  };
  const moverAPapelera = async (obra) => {
    if (!confirm(`¿Mover "${obra.nombre}" a la papelera?`)) return;
    try {
      await addDoc(collection(db, 'papeleraObras'), {
        ...obra,
        obraId:      obra.id,
        eliminadaEn: serverTimestamp(),
        expiraEn:    new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      });
      await deleteDoc(doc(db, 'obras', obra.id));
      toast.success('Obra movida a la papelera');
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const restaurarObra = async (item) => {
    try {
      await addDoc(collection(db, 'obras'), {
        ...item,
        eliminadaEn: null,
        expiraEn:    null,
        obraId:      null,
      });
      await deleteDoc(doc(db, 'papeleraObras', item.id));
      toast.success('Obra restaurada');
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const eliminarDefinitivo = async (item) => {
    if (!confirm('¿Eliminar definitivamente? Esta acción no se puede deshacer.')) return;
    try {
      await deleteDoc(doc(db, 'papeleraObras', item.id));
      toast.success('Obra eliminada definitivamente');
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-display-sm text-gray-900">Cartelera</h1>
          <p className="text-gray-500 text-sm mt-1">{obras.length} obras en total</p>
        </div>
        <div className="flex gap-2">
  <button onClick={() => setVerPapeleraObras(!verPapeleraObras)}
    className={clsx('px-4 py-2 rounded-xl text-sm font-heading font-bold transition-colors',
      verPapeleraObras ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
    )}>
    🗑 Papelera {papeleraObras.length > 0 && `(${papeleraObras.length})`}
  </button>
  <button onClick={abrirNuevo} className="btn-primary gap-2"><Plus size={18} /> Nueva obra</button>
</div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {obras.map(obra => (
          <div key={obra.id} className="card overflow-hidden">
            <div className="relative aspect-[2/3] bg-gray-100">
              {obra.posterUrl
                ? <img src={obra.posterUrl} alt={obra.nombre} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-subtle flex items-center justify-center text-gray-400 text-4xl font-display">{obra.nombre?.[0]}</div>
              }
              <div className="absolute top-2 right-2">
                <span className={clsx('badge text-xs', obra.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>{obra.activo ? 'Activa' : 'Inactiva'}</span>
              </div>
            </div>
            <div className="p-4">
              <span className="text-xs text-cyan font-heading font-bold uppercase tracking-wide">{obra.genero}</span>
              <h3 className="font-heading font-bold text-gray-900 mt-0.5">{obra.nombre}</h3>
              <p className="text-gray-500 text-sm mt-1 line-clamp-2">{obra.descripcion}</p>
              <div className="flex gap-3 mt-2 text-sm">
                <span className="text-gray-400">General: <strong className="text-azul">${obra.precioGeneral}</strong></span>
                {obra.precioVip > 0 && <span className="text-gray-400">VIP: <strong className="text-yellow-600">${obra.precioVip}</strong></span>}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {obra.layoutConfig?.totalSillas || 0} sillas · Escenario {obra.layoutConfig?.posicionEscenario || 'arriba'}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <button onClick={() => abrirEditar(obra)} className="flex items-center justify-center gap-1 py-2 rounded-lg border border-gray-200 text-xs font-heading font-bold text-gray-600 hover:border-azul hover:text-azul transition-colors"><Edit2 size={13} /> Editar</button>
                <button onClick={() => setModalFunciones(obra)} className="flex items-center justify-center gap-1 py-2 rounded-lg border border-gray-200 text-xs font-heading font-bold text-gray-600 hover:border-cyan hover:text-cyan transition-colors"><Calendar size={13} /> Funciones</button>
                <button onClick={() => handleEliminar(obra.id)} className="flex items-center justify-center gap-1 py-2 rounded-lg border border-gray-200 text-xs font-heading font-bold text-gray-600 hover:border-orange-400 hover:text-orange-500 transition-colors">
                  <Trash2 size={13} /> Desactivar
                    </button>
                <button onClick={() => moverAPapelera(obra)} className="flex items-center justify-center gap-1 py-2 rounded-lg border border-gray-200 text-xs font-heading font-bold text-gray-600 hover:border-red-400 hover:text-red-500 transition-colors">
                  <Trash2 size={13} /> Eliminar
                    </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {verPapeleraObras && (
  <div className="card p-6 mt-6 mb-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-heading font-bold text-lg text-gray-900">🗑 Papelera de obras</h2>
      <button onClick={() => setVerPapeleraObras(false)}
        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 font-heading font-bold">
        Cerrar
      </button>
    </div>
    {papeleraObras.length === 0 ? (
      <p className="text-center text-gray-400 text-sm py-6 font-heading">La papelera está vacía</p>
    ) : (
      <div className="space-y-3">
        {papeleraObras.map(item => (
          <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-orange-50 border border-orange-100">
            {item.posterUrl && <img src={item.posterUrl} alt={item.nombre} className="w-12 h-16 object-cover rounded-lg flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-sm text-gray-900">{item.nombre}</p>
              <p className="text-xs text-gray-500">{item.genero} · ${item.precioGeneral} USD</p>
              <p className="text-xs text-orange-500 mt-0.5">
                Expira: {item.expiraEn instanceof Date ? item.expiraEn.toLocaleDateString('es-VE') : '10 días'}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => restaurarObra(item)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-azul/30 text-azul hover:bg-azul/5 font-heading font-bold transition-colors">
                ↩ Restaurar
              </button>
              <button onClick={() => eliminarDefinitivo(item)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 font-heading font-bold transition-colors">
                🗑 Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="font-heading font-bold text-xl text-gray-900">{editando ? 'Editar obra' : 'Nueva obra'}</h2>
              <button onClick={() => setModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><label className="label-field">Nombre</label><input value={form.nombre} onChange={e => setForm(p => ({...p, nombre: e.target.value}))} className="input-field" placeholder="Nombre de la obra" /></div>
                <div><label className="label-field">Género</label><select value={form.genero} onChange={e => setForm(p => ({...p, genero: e.target.value}))} className="input-field"><option value="">Seleccionar</option>{GENEROS.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                <div><label className="label-field">Duración (min)</label><input type="number" value={form.duracion} onChange={e => setForm(p => ({...p, duracion: e.target.value}))} className="input-field" placeholder="90" /></div>
                <div><label className="label-field">Precio General (USD)</label><input type="number" value={form.precioGeneral} onChange={e => setForm(p => ({...p, precioGeneral: e.target.value}))} className="input-field" placeholder="10" /></div>
                <div><label className="label-field">Precio VIP (USD)</label><input type="number" value={form.precioVip} onChange={e => setForm(p => ({...p, precioVip: e.target.value}))} className="input-field" placeholder="15" /></div>
                <div className="sm:col-span-2"><label className="label-field">Director</label><input value={form.director} onChange={e => setForm(p => ({...p, director: e.target.value}))} className="input-field" /></div>
                <div className="sm:col-span-2"><label className="label-field">Reparto</label><input value={form.reparto} onChange={e => setForm(p => ({...p, reparto: e.target.value}))} className="input-field" placeholder="Actor 1, Actor 2..." /></div>
                <div className="sm:col-span-2"><label className="label-field">Descripción</label><textarea value={form.descripcion} onChange={e => setForm(p => ({...p, descripcion: e.target.value}))} className="input-field resize-none" rows={3} /></div>
                <div className="sm:col-span-2">
                  <label className="label-field">Poster (imagen)</label>
                  <label className="flex items-center gap-3 p-3 border-2 border-dashed rounded-xl cursor-pointer hover:border-azul transition-colors">
                    <input type="file" className="hidden" accept="image/*" onChange={e => setPoster(e.target.files?.[0] || null)} />
                    {poster ? <><CheckCircle size={20} className="text-green-500" /><span className="text-sm text-green-600">{poster.name}</span></> : <><Upload size={20} className="text-gray-400" /><span className="text-sm text-gray-400">Subir imagen del poster</span></>}
                  </label>
                </div>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button type="button" onClick={() => setMostrarAsientos(!mostrarAsientos)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <span className="font-heading font-bold text-gray-800 flex items-center gap-2"><Settings size={16} /> Configurar croquis de asientos</span>
                  {mostrarAsientos ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {mostrarAsientos && <div className="p-4 border-t border-gray-100"><ConfiguradorAsientos config={layoutConfig} onChange={setLayoutConfig} /></div>}
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setModal(false)} className="btn-outline flex-1 py-3">Cancelar</button>
              <button onClick={handleGuardar} disabled={guardando} className="btn-primary flex-1 py-3">
                {guardando ? <span className="spinner w-5 h-5" /> : editando ? 'Guardar cambios' : 'Crear obra'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalFunciones && <ModalFunciones obra={modalFunciones} onClose={() => setModalFunciones(null)} />}
    </div>
  );
}
