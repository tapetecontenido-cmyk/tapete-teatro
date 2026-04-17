// src/pages/admin/AdminTalleres.jsx
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, serverTimestamp, getDocs, where } from 'firebase/firestore';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { Plus, Edit2, X, Upload, CheckCircle, BookOpen, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';

const NIVELES = ['Básico', 'Intermedio', 'Avanzado', 'Niños', 'Especial', 'Profesional'];
const DIAS    = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function AdminTalleres() {
  const [talleres,  setTalleres]  = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [modal,     setModal]     = useState(false);
  const [editando,  setEditando]  = useState(null);
  const [tabId,     setTabId]     = useState(null);
  const [inscripciones, setInscripciones] = useState([]);
  const [form,      setForm]      = useState({ nombre: '', descripcion: '', nivel: '', horario: '', duracion: '', precio: '', cupoMaximo: '', profesorId: '', profesorNombre: '' });
  const [guardando, setGuardando] = useState(false);
  const [material,  setMaterial]  = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'talleres'), orderBy('creadoEn', 'desc')), snap => {
      setTalleres(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    getDocs(query(collection(db, 'users'), where('role', 'in', ['profesor', 'admin']))).then(snap => {
      setProfesores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const verAlumnos = async (tallerId) => {
    setTabId(tallerId);
    const snap = await getDocs(query(collection(db, 'inscripciones'), where('tallerId', '==', tallerId)));
    setInscripciones(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
        await addDoc(collection(db, 'talleres'), { ...data, creadoEn: serverTimestamp() });
        toast.success('Taller creado');
      }
      setModal(false);
    } catch { toast.error('Error'); }
    finally { setGuardando(false); }
  };

  const confirmarInscripcion = async (id) => {
    await updateDoc(doc(db, 'inscripciones', id), { estado: 'confirmada' });
    setInscripciones(prev => prev.map(i => i.id === id ? { ...i, estado: 'confirmada' } : i));
    toast.success('Inscripción confirmada');
  };

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
              <p className="font-heading font-bold text-azul">${t.precio} USD</p>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setEditando(t); setForm({ nombre: t.nombre, descripcion: t.descripcion || '', nivel: t.nivel || '', horario: t.horario || '', duracion: t.duracion || '', precio: t.precio || '', cupoMaximo: t.cupoMaximo || '', profesorId: t.profesorId || '', profesorNombre: t.profesorNombre || '' }); setModal(true); }}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-gray-200 text-sm font-heading font-bold text-gray-600 hover:border-azul hover:text-azul transition-colors">
                <Edit2 size={14} /> Editar
              </button>
              <button onClick={() => verAlumnos(t.id)}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-gray-200 text-sm font-heading font-bold text-gray-600 hover:border-cyan hover:text-cyan transition-colors">
                <Users size={14} /> Alumnos
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Panel de alumnos */}
      {tabId && (
        <div className="mt-8 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg text-gray-900">Inscripciones del taller</h2>
            <button onClick={() => setTabId(null)}><X size={18} className="text-gray-400" /></button>
          </div>
          {inscripciones.length === 0
            ? <p className="text-gray-400 text-sm font-heading">Sin inscripciones</p>
            : <div className="space-y-3">
                {inscripciones.map(i => (
                  <div key={i.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                    <div className="flex-1">
                      <p className="font-heading font-bold text-sm text-gray-900">{i.comprador?.nombre}</p>
                      <p className="text-xs text-gray-400">{i.comprador?.email} · {i.comprador?.cedula}</p>
                    </div>
                    <span className={`badge ${i.estado === 'confirmada' ? 'badge-confirmed' : i.estado === 'cancelada' ? 'badge-cancelled' : 'badge-pending'}`}>{i.estado}</span>
                    {i.estado === 'pendiente' && (
                      <button onClick={() => confirmarInscripcion(i.id)} className="btn-primary text-xs py-1.5 px-3">Confirmar</button>
                    )}
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
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
