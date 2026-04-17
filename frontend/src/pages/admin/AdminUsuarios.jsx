// src/pages/admin/AdminUsuarios.jsx
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const ROLES = ['alumno', 'profesor', 'admin'];

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'users'), orderBy('creadoEn', 'desc')), snap => {
      setUsuarios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCargando(false);
    });
    return unsub;
  }, []);

  const filtrados = usuarios.filter(u =>
    !busqueda ||
    u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.cedula?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const cambiarRol = async (id, role) => {
    await updateDoc(doc(db, 'users', id), { role });
    toast.success(`Rol actualizado a ${role}`);
  };

  const toggleActivo = async (id, activo) => {
    await updateDoc(doc(db, 'users', id), { activo: !activo });
    toast.success(activo ? 'Cuenta desactivada' : 'Cuenta activada');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-display-sm text-gray-900">Usuarios</h1>
        <p className="text-gray-500 text-sm mt-1">{usuarios.length} usuarios registrados</p>
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por nombre, email o cédula..." className="input-field pl-10" />
      </div>

      <div className="card overflow-hidden">
        {cargando ? (
          <div className="p-8 space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50 text-xs font-heading font-bold text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Usuario</th>
                <th className="px-5 py-3 text-left hidden md:table-cell">Cédula</th>
                <th className="px-5 py-3 text-left hidden lg:table-cell">Registro</th>
                <th className="px-5 py-3 text-center">Rol</th>
                <th className="px-5 py-3 text-center">Estado</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {filtrados.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.nombre?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-heading font-bold text-sm text-gray-900">{u.nombre}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-sm text-gray-500">{u.cedula}</td>
                    <td className="px-5 py-3 hidden lg:table-cell text-xs text-gray-400">
                      {u.creadoEn && format(u.creadoEn.toDate?.() || new Date(), 'd MMM yyyy', { locale: es })}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <select value={u.role} onChange={e => cambiarRol(u.id, e.target.value)}
                        className="text-xs font-heading font-bold border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-azul capitalize">
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button onClick={() => toggleActivo(u.id, u.activo)}
                        className={clsx('p-1.5 rounded-lg transition-colors', u.activo ? 'text-green-500 hover:bg-green-50' : 'text-gray-300 hover:bg-gray-100')}>
                        {u.activo ? <CheckCircle size={18} /> : <XCircle size={18} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
