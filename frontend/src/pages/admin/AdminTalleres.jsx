// src/pages/admin/AdminTalleres.jsx
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, getDocs, where, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { subirArchivo } from '../../utils/subirArchivo';
import { Plus, Edit2, X, Upload, CheckCircle, BookOpen, Users, FileText, Link2, MessageSquare, Lock, Unlock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import { clsx } from 'clsx';

const NIVELES = ['Básico', 'Intermedio', 'Avanzado', 'Niños', 'Especial', 'Profesional'];

const TIPOS_MATERIAL = [
  { id: 'mensaje', label: 'Mensaje', icon: MessageSquare },
  { id: 'pdf',     label: 'PDF',     icon: FileText },
  { id: 'video',   label: 'Link / Video', icon: Link2 },
];

export default function AdminTalleres() {
  const [talleres,      setTalleres]      = useState([]);
  const [profesores,    setProfesores]    = useState([]);
  const [modal,         setModal]         = useState(false);
  const [editando,      setEditando]      = useState(null);
  const [tabId,         setTabId]         = useState(null);
  const [tallerActivo,  setTallerActivo]  = useState(null);
  const [vistaTab,      setVistaTab]      = useState('inscripciones');
  const [inscripciones, setInscripciones] = useState([]);
  const [materiales,    setMateriales]    = useState([]);
  const [form,          setForm]          = useState({ nombre: '', descripcion: '', nivel: '', horario: '', duracion: '', precio: '', cupoMaximo: '', profesorId: '', profesorNombre: '' });
  const [guardando,     setGuardando]     = useState(false);

  const [nuevoMaterial, setNuevoMaterial] = useState({ tipo: 'mensaje', titulo: '', contenido: '' });
  const [archivoPdf,    setArchivoPdf]    = useState(null);
  const [subiendo,      setSubiendo]      = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'talleres'), orderBy('creadoEn', 'desc')), snap => {
      setTalleres(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    getDocs(query(collection(db, 'users'), where('role', 'in', ['profesor', 'admin']))).then(snap => {
      setProfesores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const abrirTaller = async (tallerId, vista = 'inscripciones') => {
    setTabId(tallerId);
    setVistaTab(vista);
    setTallerActivo(talleres.find(t => t.id === tallerId) || null);
    const insSnap = await getDocs(query(collection(db, 'inscripciones'), where('tallerId', '==', tallerId)));
    setInscripciones(insSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const matSnap = await getDocs(query(collection(db, 'talleres', tallerId, 'materiales'), orderBy('orden', 'asc')));
    setMateriales(matSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleGuardar = async () => {
    if (!form.nombre) { toast.error('El nombre es requerido'); return; }
    setGuardando(true);
    try {
      const data = {
        nombre:        DOMPurify.sanitize(form.nombre.trim()),
        descripcion:   DOMPurify.sanitize(form.descripcion.trim()),
        nivel:         form.nivel,
        horario:       DOMPurify.sanitize(form.horario.trim()),
        duracion:      form.duracion,
        precio:        Number(form.precio) || 0,
        cupoMaximo:    Number(form.cupoMaximo) || 0,
        profesorId:    form.profesorId,
        profesorNombre: form.profesorNombre,
        activo:        true,
        actualizadoEn: serverTimestamp(),
      };
      if (editando) {
        await updateDoc(doc(db, 'talleres', editando.id), data);
        toast.success('Taller actualizado');
      } else {
        // alumnosAprobados inicia vacío — necesario para las reglas de seguridad del Camerino
        await addDoc(collection(db, 'talleres'), { ...data, alumnosAprobados: [], creadoEn: serverTimestamp() });
        toast.success('Taller creado');
      }
      setModal(false);
    } catch { toast.error('Error'); }
    finally { setGuardando(false); }
  };

  // ── Inscripciones ────────────────────────────────────────────────────
  const aprobarInscripcion = async (i) => {
    try {
      await updateDoc(doc(db, 'inscripciones', i.id), { estado: 'aprobada' });
      // Agregar el uid del alumno al array de aprobados del taller (necesario para el Camerino)
      await updateDoc(doc(db, 'talleres', i.tallerId), { alumnosAprobados: arrayUnion(i.userId) });
      // Notificar al alumno
      await addDoc(collection(db, 'notificaciones'), {
        userId:   i.userId,
        titulo:   '¡Inscripción aprobada!',
        mensaje:  `Tu inscripción al taller "${i.tallerNombre}" fue aprobada. Ya puedes ver el contenido en tu Camerino.`,
        leida:    false,
        creadaEn: serverTimestamp(),
      });
      setInscripciones(prev => prev.map(x => x.id === i.id ? { ...x, estado: 'aprobada' } : x));
      toast.success('Inscripción aprobada — el alumno ya tiene acceso al Camerino');
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const rechazarInscripcion = async (i) => {
    try {
      await updateDoc(doc(db, 'inscripciones', i.id), { estado: 'rechazada' });
      setInscripciones(prev => prev.map(x => x.id === i.id ? { ...x, estado: 'rechazada' } : x));
      toast.success('Inscripción rechazada');
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const quitarAcceso = async (i) => {
    if (!confirm('¿Quitar el acceso de este alumno al taller?')) return;
    try {
      await deleteDoc(doc(db, 'inscripciones', i.id));
      // Quitar el uid del array de aprobados del taller
      await updateDoc(doc(db, 'talleres', i.tallerId), { alumnosAprobados: arrayRemove(i.userId) });
      setInscripciones(prev => prev.filter(x => x.id !== i.id));
      toast.success('Acceso removido');
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  // ── Camerino / materiales ────────────────────────────────────────────
  const agregarMaterial = async () => {
    if (!nuevoMaterial.titulo.trim()) { toast.error('El título es requerido'); return; }
    if (nuevoMaterial.tipo !== 'pdf' && !nuevoMaterial.contenido.trim()) { toast.error('El contenido es requerido'); return; }
    if (nuevoMaterial.tipo === 'pdf' && !archivoPdf) { toast.error('Sube un archivo PDF'); return; }

    setSubiendo(true);
    try {
      let contenido = nuevoMaterial.contenido.trim();
      if (nuevoMaterial.tipo === 'pdf') {
        contenido = await subirArchivo(archivoPdf, 'materiales-camerino');
      }

      await addDoc(collection(db, 'talleres', tabId, 'materiales'), {
        tipo:         nuevoMaterial.tipo,
        titulo:       DOMPurify.sanitize(nuevoMaterial.titulo.trim()),
        contenido:    nuevoMaterial.tipo === 'mensaje' ? DOMPurify.sanitize(contenido) : contenido,
        desbloqueado: false,
        orden:        materiales.length,
        creadoEn:     serverTimestamp(),
      });

      const matSnap = await getDocs(query(collection(db, 'talleres', tabId, 'materiales'), orderBy('orden', 'asc')));
      setMateriales(matSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setNuevoMaterial({ tipo: 'mensaje', titulo: '', contenido: '' });
      setArchivoPdf(null);
      toast.success('Material agregado');
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const toggleDesbloqueo = async (material) => {
    const nuevoEstado = !material.desbloqueado;
    await updateDoc(doc(db, 'talleres', tabId, 'materiales', material.id), { desbloqueado: nuevoEstado });
    setMateriales(prev => prev.map(m => m.id === material.id ? { ...m, desbloqueado: nuevoEstado } : m));

    // Notificar a los alumnos aprobados del taller solo al desbloquear
    if (nuevoEstado && tallerActivo?.alumnosAprobados?.length > 0) {
      const tipoLabel = material.tipo === 'pdf' ? 'un nuevo PDF' : material.tipo === 'video' ? 'un nuevo enlace' : 'un nuevo mensaje';
      await Promise.all(tallerActivo.alumnosAprobados.filter(Boolean).map(uid =>
        addDoc(collection(db, 'notificaciones'), {
          userId:   uid,
          titulo:   'Nuevo contenido en tu Camerino',
          mensaje:  `Tu profesor agregó ${tipoLabel} en "${tallerActivo.nombre}": ${material.titulo}`,
          leida:    false,
          creadaEn: serverTimestamp(),
        })
      ));
    }
  };

  const eliminarMaterial = async (id) => {
    if (!confirm('¿Eliminar este material?')) return;
    await deleteDoc(doc(db, 'talleres', tabId, 'materiales', id));
    setMateriales(prev => prev.filter(m => m.id !== id));
    toast.success('Material eliminado');
  };

  const alumnosAprobados = inscripciones.filter(i => i.estado === 'aprobada');
  const alumnosPendientes = inscripciones.filter(i => i.estado === 'pendiente');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-display-sm text-gray-900">Talleres</h1>
        <button onClick={() => { setEditando(null); setForm({ nombre: '', descripcion: '', nivel: '', horario: '', duracion: '', precio: '', cupoMaximo: '', profesorId: '', profesorNombre: '' }); setModal(true); }} className="btn-primary gap-2"><Plus size={18} /> Nuevo taller</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {talleres.map(t => (
          <div key={t.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center"><BookOpen size={18} className="text-white" /></div>
              <span className="badge bg-azul/10 text-azul">{t.nivel}</span>
            </div>
            <h3 className="font-heading font-bold text-gray-900">{t.nombre}</h3>
            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{t.descripcion}</p>
            <div className="mt-3 text-sm space-y-1 text-gray-500">
              <p>🕐 {t.horario}</p>
              <p>👤 {t.profesorNombre || '—'}</p>
              {t.precio > 0 && <p className="font-heading font-bold text-azul">${t.precio} USD</p>}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <button onClick={() => { setEditando(t); setForm({ nombre: t.nombre, descripcion: t.descripcion || '', nivel: t.nivel || '', horario: t.horario || '', duracion: t.duracion || '', precio: t.precio || '', cupoMaximo: t.cupoMaximo || '', profesorId: t.profesorId || '', profesorNombre: t.profesorNombre || '' }); setModal(true); }}
                className="flex items-center justify-center gap-1 py-2 rounded-lg border border-gray-200 text-xs font-heading font-bold text-gray-600 hover:border-azul hover:text-azul transition-colors">
                <Edit2 size={13} /> Editar
              </button>
              <button onClick={() => abrirTaller(t.id, 'inscripciones')}
                className="flex items-center justify-center gap-1 py-2 rounded-lg border border-gray-200 text-xs font-heading font-bold text-gray-600 hover:border-cyan hover:text-cyan transition-colors">
                <Users size={13} /> Alumnos
              </button>
              <button onClick={() => abrirTaller(t.id, 'camerino')}
                className="flex items-center justify-center gap-1 py-2 rounded-lg border border-gray-200 text-xs font-heading font-bold text-gray-600 hover:border-azul hover:text-azul transition-colors">
                <FileText size={13} /> Camerino
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Panel de gestión del taller */}
      {tabId && (
        <div className="mt-8 card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
              <button onClick={() => setVistaTab('inscripciones')}
                className={clsx('px-4 py-2 rounded-lg text-sm font-heading font-bold transition-colors',
                  vistaTab === 'inscripciones' ? 'bg-white shadow-sm text-azul' : 'text-gray-500')}>
                Inscripciones {alumnosPendientes.length > 0 && `(${alumnosPendientes.length})`}
              </button>
              <button onClick={() => setVistaTab('camerino')}
                className={clsx('px-4 py-2 rounded-lg text-sm font-heading font-bold transition-colors',
                  vistaTab === 'camerino' ? 'bg-white shadow-sm text-azul' : 'text-gray-500')}>
                Camerino
              </button>
            </div>
            <button onClick={() => setTabId(null)}><X size={18} className="text-gray-400" /></button>
          </div>

          {/* Vista Inscripciones */}
          {vistaTab === 'inscripciones' && (
            inscripciones.length === 0
              ? <p className="text-gray-400 text-sm font-heading text-center py-6">Sin solicitudes de inscripción</p>
              : <div className="space-y-3">
                  {inscripciones.map(i => (
                    <div key={i.id} className="p-4 rounded-xl bg-gray-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-heading font-bold text-sm text-gray-900">{i.alumno?.nombre}</p>
                          <p className="text-xs text-gray-400">{i.alumno?.email} · {i.alumno?.cedula}</p>
                        </div>
                        <span className={clsx('badge',
                          i.estado === 'aprobada' ? 'badge-confirmed' :
                          i.estado === 'rechazada' ? 'badge-cancelled' : 'badge-pending'
                        )}>{i.estado}</span>
                      </div>
                      {i.alumno?.telefono && (
                        <p className="text-xs text-gray-500">📞 {i.alumno.telefono}</p>
                      )}
                      <div className="flex gap-2 pt-1">
                        {i.estado === 'pendiente' && (
                          <>
                            <button onClick={() => aprobarInscripcion(i)} className="btn-primary text-xs py-1.5 px-3">Aprobar</button>
                            <button onClick={() => rechazarInscripcion(i)} className="text-xs py-1.5 px-3 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 font-heading font-bold">Rechazar</button>
                          </>
                        )}
                        {i.estado === 'aprobada' && (
                          <button onClick={() => quitarAcceso(i)} className="text-xs py-1.5 px-3 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 font-heading font-bold">Quitar acceso</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
          )}

          {/* Vista Camerino */}
          {vistaTab === 'camerino' && (
            <div className="space-y-6">
              <p className="text-sm text-gray-500">
                {alumnosAprobados.length} alumno{alumnosAprobados.length !== 1 ? 's' : ''} con acceso a este Camerino
              </p>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-heading font-bold text-sm text-gray-700 mb-3">Agregar material</p>
                <div className="flex gap-2 mb-3">
                  {TIPOS_MATERIAL.map(({ id, label, icon: Icon }) => (
                    <button key={id} type="button" onClick={() => setNuevoMaterial(p => ({ ...p, tipo: id }))}
                      className={clsx('flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-heading font-bold border-2 transition-all',
                        nuevoMaterial.tipo === id ? 'border-azul bg-azul text-white' : 'border-gray-200 text-gray-600 hover:border-azul')}>
                      <Icon size={13} /> {label}
                    </button>
                  ))}
                </div>
                <input type="text" placeholder="Título del material" value={nuevoMaterial.titulo}
                  onChange={e => setNuevoMaterial(p => ({ ...p, titulo: e.target.value }))}
                  className="input-field text-sm py-2 mb-3" />

                {nuevoMaterial.tipo === 'mensaje' && (
                  <textarea placeholder="Escribe el mensaje..." value={nuevoMaterial.contenido}
                    onChange={e => setNuevoMaterial(p => ({ ...p, contenido: e.target.value }))}
                    className="input-field text-sm resize-none" rows={3} />
                )}
                {nuevoMaterial.tipo === 'video' && (
                  <input type="url" placeholder="https://youtube.com/... o cualquier link" value={nuevoMaterial.contenido}
                    onChange={e => setNuevoMaterial(p => ({ ...p, contenido: e.target.value }))}
                    className="input-field text-sm py-2" />
                )}
                {nuevoMaterial.tipo === 'pdf' && (
                  <label className="flex items-center gap-3 p-3 border-2 border-dashed rounded-xl cursor-pointer hover:border-azul transition-colors">
                    <input type="file" accept="application/pdf" className="hidden" onChange={e => setArchivoPdf(e.target.files?.[0] || null)} />
                    {archivoPdf ? <><CheckCircle size={18} className="text-green-500" /><span className="text-sm text-green-600">{archivoPdf.name}</span></> : <><Upload size={18} className="text-gray-400" /><span className="text-sm text-gray-400">Subir archivo PDF</span></>}
                  </label>
                )}

                <button onClick={agregarMaterial} disabled={subiendo} className="btn-primary w-full mt-3 py-2.5 text-sm gap-2">
                  {subiendo ? <span className="spinner w-4 h-4" /> : <><Plus size={15} /> Agregar al Camerino</>}
                </button>
              </div>

              <div className="space-y-2">
                {materiales.length === 0
                  ? <p className="text-center text-gray-400 text-sm py-6 font-heading">Aún no hay materiales en este Camerino</p>
                  : materiales.map(m => {
                      const Icon = TIPOS_MATERIAL.find(t => t.id === m.tipo)?.icon || FileText;
                      return (
                        <div key={m.id} className={clsx('flex items-center gap-3 p-3.5 rounded-xl border transition-colors',
                          m.desbloqueado ? 'bg-green-50/50 border-green-100' : 'bg-gray-50 border-gray-100')}>
                          <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                            m.desbloqueado ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400')}>
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-heading font-bold text-sm text-gray-900 truncate">{m.titulo}</p>
                            <p className="text-xs text-gray-400 capitalize">{m.tipo}</p>
                          </div>
                          <button onClick={() => toggleDesbloqueo(m)}
                            className={clsx('flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-colors flex-shrink-0',
                              m.desbloqueado ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300')}>
                            {m.desbloqueado ? <><Unlock size={12} /> Visible</> : <><Lock size={12} /> Bloqueado</>}
                          </button>
                          <button onClick={() => eliminarMaterial(m.id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-gray-300 flex-shrink-0">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal crear/editar taller */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal-container max-w-xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-heading font-bold text-xl">{editando ? 'Editar taller' : 'Nuevo taller'}</h2>
              <button onClick={() => setModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="label-field">Nombre</label><input value={form.nombre} onChange={e => setForm(p => ({...p, nombre: e.target.value}))} className="input-field" /></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="label-field">Nivel</label>
                  <select value={form.nivel} onChange={e => setForm(p => ({...p, nivel: e.target.value}))} className="input-field">
                    <option value="">Seleccionar</option>{NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div><label className="label-field">Precio (USD/mes)</label><input type="number" value={form.precio} onChange={e => setForm(p => ({...p, precio: e.target.value}))} className="input-field" /></div>
                <div><label className="label-field">Horario</label><input value={form.horario} onChange={e => setForm(p => ({...p, horario: e.target.value}))} className="input-field" placeholder="Lunes 6pm" /></div>
                <div><label className="label-field">Cupo máximo</label><input type="number" value={form.cupoMaximo} onChange={e => setForm(p => ({...p, cupoMaximo: e.target.value}))} className="input-field" /></div>
              </div>
              <div><label className="label-field">Profesor</label>
                <select value={form.profesorId} onChange={e => { const p = profesores.find(p => p.id === e.target.value); setForm(prev => ({...prev, profesorId: e.target.value, profesorNombre: p?.nombre || ''})); }} className="input-field">
                  <option value="">Sin asignar</option>
                  {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div><label className="label-field">Descripción</label><textarea value={form.descripcion} onChange={e => setForm(p => ({...p, descripcion: e.target.value}))} className="input-field resize-none" rows={3} /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(false)} className="btn-outline flex-1 py-3">Cancelar</button>
              <button onClick={handleGuardar} disabled={guardando} className="btn-primary flex-1 py-3">
                {guardando ? <span className="spinner w-5 h-5" /> : editando ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
