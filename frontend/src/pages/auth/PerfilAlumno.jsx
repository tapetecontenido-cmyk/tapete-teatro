// src/pages/auth/PerfilAlumno.jsx
import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { subirArchivo } from '../../utils/subirArchivo';
import { db, storage } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Camera, Edit2, Save, X, Ticket, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import DOMPurify from 'dompurify';

export default function PerfilAlumno() {
  const { user, perfil, cargarPerfil } = useAuth();
  const [editando,   setEditando]   = useState(false);
  const [form,       setForm]       = useState({});
  const [reservas,   setReservas]   = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [tab,        setTab]        = useState('reservas');
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [guardando,  setGuardando]  = useState(false);

  useEffect(() => {
    if (perfil) setForm({ nombre: perfil.nombre, cedula: perfil.cedula, telefono: perfil.telefono, bio: perfil.bio || '', nivel: perfil.nivel || '' });
  }, [perfil]);

  useEffect(() => {
    if (!user) return;
    getDocs(query(collection(db, 'reservas'), where('userId', '==', user.uid), orderBy('creadoEn', 'desc')))
      .then(snap => setReservas(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    getDocs(query(collection(db, 'inscripciones'), where('userId', '==', user.uid), orderBy('creadoEn', 'desc')))
      .then(snap => setInscripciones(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  const handleFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Máximo 5MB'); return; }
    setSubiendoFoto(true);
    try {
      const url = await subirArchivo(file, 'perfiles');
      await updateDoc(doc(db, 'users', user.uid), { fotoPerfil: url });
      await cargarPerfil(user.uid);
      toast.success('Foto actualizada');
    } catch { toast.error('Error al subir foto'); }
    finally { setSubiendoFoto(false); }
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        nombre:   DOMPurify.sanitize(form.nombre?.trim()),
        cedula:   DOMPurify.sanitize(form.cedula?.trim()),
        telefono: DOMPurify.sanitize(form.telefono?.trim()),
        bio:      DOMPurify.sanitize(form.bio?.trim()),
        nivel:    form.nivel,
      });
      await cargarPerfil(user.uid);
      setEditando(false);
      toast.success('Perfil actualizado');
    } catch { toast.error('Error al guardar'); }
    finally { setGuardando(false); }
  };

  if (!perfil) return <div className="min-h-screen flex items-center justify-center pt-20"><div className="spinner w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Sidebar: foto y datos */}
          <div className="lg:col-span-1 space-y-5">
            <div className="card p-6 text-center">
              <div className="relative inline-block mb-4">
                {perfil.fotoPerfil
                  ? <img src={perfil.fotoPerfil} alt={perfil.nombre} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-brand" />
                  : <div className="w-24 h-24 rounded-full bg-gradient-brand mx-auto flex items-center justify-center text-white text-3xl font-bold">{perfil.nombre?.[0]?.toUpperCase()}</div>
                }
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-azul rounded-full flex items-center justify-center cursor-pointer shadow hover:bg-azul-dark transition-colors">
                  <Camera size={14} className="text-white" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleFoto} disabled={subiendoFoto} />
                </label>
              </div>
              {editando ? (
                <div className="space-y-3 text-left">
                  {[{ key: 'nombre', label: 'Nombre', type: 'text' }, { key: 'cedula', label: 'Cédula', type: 'text' }, { key: 'telefono', label: 'Teléfono', type: 'tel' }].map(({ key, label, type }) => (
                    <div key={key}><label className="label-field">{label}</label><input type={type} value={form[key] || ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} className="input-field text-sm py-2" /></div>
                  ))}
                  <div><label className="label-field">Nivel de experiencia</label>
                    <select value={form.nivel} onChange={e => setForm(p => ({ ...p, nivel: e.target.value }))} className="input-field text-sm py-2">
                      <option value="">Seleccionar...</option>
                      {['Principiante', 'Básico', 'Intermedio', 'Avanzado', 'Profesional'].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div><label className="label-field">Bio</label><textarea value={form.bio || ''} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} className="input-field text-sm py-2 resize-none" rows={3} maxLength={300} /></div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditando(false)} className="btn-outline flex-1 py-2 text-sm"><X size={14} /> Cancelar</button>
                    <button onClick={handleGuardar} disabled={guardando} className="btn-primary flex-1 py-2 text-sm"><Save size={14} /> {guardando ? '...' : 'Guardar'}</button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="font-heading font-bold text-gray-900 text-xl">{perfil.nombre}</h2>
                  <p className="text-cyan text-sm font-heading mt-0.5 capitalize">{perfil.role}</p>
                  {perfil.nivel && <p className="text-gray-400 text-xs mt-1">{perfil.nivel}</p>}
                  {perfil.bio && <p className="text-gray-500 text-sm mt-3 leading-relaxed">{perfil.bio}</p>}
                  <div className="mt-4 text-sm text-gray-500 space-y-1 text-left">
                    <p>📧 {perfil.email}</p>
                    {perfil.cedula   && <p>🪪 {perfil.cedula}</p>}
                    {perfil.telefono && <p>📞 {perfil.telefono}</p>}
                  </div>
                  <button onClick={() => setEditando(true)} className="btn-outline w-full mt-4 py-2.5 text-sm gap-1"><Edit2 size={14} /> Editar perfil</button>
                </>
              )}
            </div>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-2 mb-5">
              {[['reservas', Ticket, 'Mis Reservas'], ['inscripciones', BookOpen, 'Mis Talleres']].map(([t, Icon, label]) => (
                <button key={t} onClick={() => setTab(t)}
                  className={clsx('flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-bold text-sm transition-all',
                    tab === t ? 'bg-azul text-white shadow-brand' : 'bg-white border border-gray-200 text-gray-600 hover:border-azul hover:text-azul'
                  )}>
                  <Icon size={16} />{label}
                </button>
              ))}
            </div>

            {/* Reservas */}
            {tab === 'reservas' && (
              <div className="space-y-3">
                {reservas.length === 0
                  ? <div className="card p-12 text-center text-gray-400"><Ticket size={40} className="mx-auto mb-3 opacity-30" /><p className="font-heading">No tienes reservas aún</p></div>
                  : reservas.map(r => (
                    <div key={r.id} className="card p-5 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-azul/10 flex items-center justify-center flex-shrink-0"><Ticket size={18} className="text-azul" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-bold text-gray-900 truncate">{r.obraNombre || 'Obra'}</p>
                        <p className="text-xs text-gray-400">
                          {r.asientos?.join(', ')} · ${r.total} USD ·
                          {r.creadoEn && ' ' + format(r.creadoEn.toDate?.() || new Date(), "d MMM yyyy", { locale: es })}
                        </p>
                      </div>
                      <span className={clsx('badge flex-shrink-0', r.estado === 'confirmada' ? 'badge-confirmed' : r.estado === 'cancelada' ? 'badge-cancelled' : 'badge-pending')}>
                        {r.estado}
                      </span>
                    </div>
                  ))
                }
              </div>
            )}

            {/* Inscripciones */}
            {tab === 'inscripciones' && (
              <div className="space-y-3">
                {inscripciones.length === 0
                  ? <div className="card p-12 text-center text-gray-400"><BookOpen size={40} className="mx-auto mb-3 opacity-30" /><p className="font-heading">No estás inscrito en talleres</p></div>
                  : inscripciones.map(i => (
                    <div key={i.id} className="card p-5 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center flex-shrink-0"><BookOpen size={18} className="text-cyan" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-bold text-gray-900 truncate">{i.tallerNombre || 'Taller'}</p>
                        <p className="text-xs text-gray-400">
                          {i.creadoEn && format(i.creadoEn.toDate?.() || new Date(), "d MMM yyyy", { locale: es })}
                        </p>
                      </div>
                      <span className={clsx('badge flex-shrink-0', i.estado === 'confirmada' ? 'badge-confirmed' : i.estado === 'cancelada' ? 'badge-cancelled' : 'badge-pending')}>
                        {i.estado}
                      </span>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
