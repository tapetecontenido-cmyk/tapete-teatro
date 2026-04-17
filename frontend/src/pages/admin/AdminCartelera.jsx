// src/pages/admin/AdminCartelera.jsx
// Gestión de cartelera — Panel Admin
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { Plus, Edit2, Trash2, X, Upload, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';

const GENEROS = ['Drama', 'Comedia', 'Musical', 'Infantil', 'Danza', 'Monólogo', 'Experimental'];

export default function AdminCartelera() {
  const [obras,   setObras]   = useState([]);
  const [modal,   setModal]   = useState(false);
  const [editando, setEditando] = useState(null);
  const [form,    setForm]    = useState({ nombre: '', genero: '', descripcion: '', director: '', reparto: '', duracion: '', precioGeneral: '', precioVip: '' });
  const [poster,  setPoster]  = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'obras'), orderBy('creadoEn', 'desc')), snap => {
      setObras(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const abrirNuevo = () => { setEditando(null); setForm({ nombre: '', genero: '', descripcion: '', director: '', reparto: '', duracion: '', precioGeneral: '', precioVip: '' }); setPoster(null); setModal(true); };
  const abrirEditar = (obra) => { setEditando(obra); setForm({ nombre: obra.nombre, genero: obra.genero || '', descripcion: obra.descripcion || '', director: obra.director || '', reparto: obra.reparto || '', duracion: obra.duracion || '', precioGeneral: obra.precioGeneral || '', precioVip: obra.precioVip || '' }); setPoster(null); setModal(true); };

  const handleGuardar = async () => {
    if (!form.nombre) { toast.error('El nombre es requerido'); return; }
    setGuardando(true);
    try {
      let posterUrl = editando?.posterUrl || '';
      if (poster) {
        const ref = sRef(storage, `posters/${Date.now()}_${poster.name}`);
        await uploadBytes(ref, poster);
        posterUrl = await getDownloadURL(ref);
      }

      const data = {
        nombre:        DOMPurify.sanitize(form.nombre.trim()),
        genero:        form.genero,
        descripcion:   DOMPurify.sanitize(form.descripcion.trim()),
        director:      DOMPurify.sanitize(form.director.trim()),
        reparto:       DOMPurify.sanitize(form.reparto.trim()),
        duracion:      form.duracion,
        precioGeneral: Number(form.precioGeneral) || 0,
        precioVip:     Number(form.precioVip) || 0,
        posterUrl,
        activo:        true,
        actualizadoEn: serverTimestamp(),
      };

      if (editando) {
        await updateDoc(doc(db, 'obras', editando.id), data);
        toast.success('Obra actualizada');
      } else {
        await addDoc(collection(db, 'obras'), { ...data, creadoEn: serverTimestamp() });
        toast.success('Obra creada');
      }
      setModal(false);
    } catch (err) { toast.error('Error: ' + err.message); }
    finally { setGuardando(false); }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar esta obra?')) return;
    await updateDoc(doc(db, 'obras', id), { activo: false });
    toast.success('Obra desactivada');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-display-sm text-gray-900">Cartelera</h1>
          <p className="text-gray-500 text-sm mt-1">{obras.length} obras en total</p>
        </div>
        <button onClick={abrirNuevo} className="btn-primary gap-2"><Plus size={18} /> Nueva obra</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {obras.map(obra => (
          <div key={obra.id} className="card overflow-hidden">
            <div className="relative aspect-[2/3] bg-gray-100">
              {obra.posterUrl
                ? <img src={obra.posterUrl} alt={obra.nombre} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-subtle flex items-center justify-center text-gray-400 text-4xl font-display">{obra.nombre?.[0]}</div>
              }
              <div className="absolute top-2 right-2 flex gap-2">
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
              <div className="flex gap-2 mt-4">
                <button onClick={() => abrirEditar(obra)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-gray-200 text-sm font-heading font-bold text-gray-600 hover:border-azul hover:text-azul transition-colors">
                  <Edit2 size={14} /> Editar
                </button>
                <button onClick={() => handleEliminar(obra.id)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-gray-200 text-sm font-heading font-bold text-gray-600 hover:border-red-400 hover:text-red-500 transition-colors">
                  <Trash2 size={14} /> Desactivar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal crear/editar */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-container max-w-2xl p-6 sm:p-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading font-bold text-xl text-gray-900">{editando ? 'Editar obra' : 'Nueva obra'}</h2>
              <button onClick={() => setModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className="label-field">Nombre</label><input value={form.nombre} onChange={e => setForm(p => ({...p, nombre: e.target.value}))} className="input-field" placeholder="Nombre de la obra" /></div>
              <div><label className="label-field">Género</label>
                <select value={form.genero} onChange={e => setForm(p => ({...p, genero: e.target.value}))} className="input-field">
                  <option value="">Seleccionar</option>
                  {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
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
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(false)} className="btn-outline flex-1 py-3">Cancelar</button>
              <button onClick={handleGuardar} disabled={guardando} className="btn-primary flex-1 py-3">
                {guardando ? <span className="spinner w-5 h-5" /> : editando ? 'Guardar cambios' : 'Crear obra'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
