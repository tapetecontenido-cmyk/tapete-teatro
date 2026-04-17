// src/pages/public/Talleres.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { BookOpen, Search } from 'lucide-react';
import { clsx } from 'clsx';

const NIVELES = ['Todos', 'Básico', 'Intermedio', 'Avanzado', 'Niños', 'Especial', 'Profesional'];

export default function Talleres() {
  const [talleres, setTalleres] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [nivel,    setNivel]    = useState('Todos');

  useEffect(() => {
    getDocs(query(collection(db, 'talleres'), where('activo', '==', true), orderBy('creadoEn', 'desc')))
      .then(snap => { setTalleres(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setCargando(false); });
  }, []);

  const filtrados = talleres.filter(t =>
    (nivel === 'Todos' || t.nivel === nivel) &&
    (!busqueda || t.nombre?.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="bg-gradient-brand text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-white/70 text-sm font-heading uppercase tracking-widest mb-2">Formación actoral</p>
          <h1 className="font-display text-display-md mb-3">Talleres y Cursos</h1>
          <div className="w-16 h-1 bg-white/30 rounded-full" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar taller..." className="input-field pl-10" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {NIVELES.map(n => (
              <button key={n} onClick={() => setNivel(n)}
                className={clsx('px-3 py-2 rounded-xl text-xs font-heading font-bold transition-all',
                  nivel === n ? 'bg-azul text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-azul hover:text-azul'
                )}>{n}</button>
            ))}
          </div>
        </div>

        {cargando ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{[1,2,3].map(i => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-20 text-gray-400"><BookOpen size={56} className="mx-auto mb-4 opacity-30" /><h3 className="font-heading text-xl">No hay talleres disponibles</h3></div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtrados.map(t => (
              <Link key={t.id} to={`/talleres/${t.id}`} className="card group p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center"><BookOpen size={20} className="text-white" /></div>
                  <span className="badge bg-azul/10 text-azul">{t.nivel}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-gray-900 text-lg">{t.nombre}</h3>
                  <p className="text-gray-500 text-sm mt-2 line-clamp-3">{t.descripcion}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm border-t border-gray-100 pt-3">
                  <div><p className="text-xs text-gray-400 font-heading">Horario</p><p className="font-medium text-gray-700">{t.horario}</p></div>
                  <div><p className="text-xs text-gray-400 font-heading">Precio</p><p className="font-heading font-bold text-azul">${t.precio} USD</p></div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
