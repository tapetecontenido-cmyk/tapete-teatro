// src/pages/public/Cartelera.jsx
// Listado de obras en cartelera — Tapete Teatro
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Ticket, Search, Filter } from 'lucide-react';
import { clsx } from 'clsx';

function BadgeDisponibilidad({ disponibles, total }) {
  const pct = total > 0 ? disponibles / total : 0;
  if (disponibles === 0)  return <span className="badge badge-agotado">Agotado</span>;
  if (pct <= 0.2)         return <span className="badge badge-pocas">Pocas entradas</span>;
  return <span className="badge badge-disponible">Disponible</span>;
}

export default function Cartelera() {
  const [obras,    setObras]    = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroGenero, setFiltroGenero] = useState('todos');

  useEffect(() => {
    const fetchObras = async () => {
      const snap = await getDocs(
        query(collection(db, 'obras'), where('activo', '==', true), orderBy('creadoEn', 'desc'))
      );
      setObras(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCargando(false);
    };
    fetchObras();
  }, []);

  const generos = ['todos', ...new Set(obras.map(o => o.genero).filter(Boolean))];
  const obrasFiltradas = obras.filter(o => {
    const matchBusq  = !busqueda || o.nombre?.toLowerCase().includes(busqueda.toLowerCase());
    const matchGenero = filtroGenero === 'todos' || o.genero === filtroGenero;
    return matchBusq && matchGenero;
  });

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Header */}
      <div className="bg-gradient-brand text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-white/70 text-sm font-heading uppercase tracking-widest mb-2">Temporada actual</p>
          <h1 className="font-display text-display-md mb-3">Cartelera</h1>
          <div className="w-16 h-1 bg-white/30 rounded-full" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar obra..." className="input-field pl-10" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {generos.map(g => (
              <button key={g} onClick={() => setFiltroGenero(g)}
                className={clsx('px-4 py-2 rounded-xl text-sm font-heading font-bold transition-all capitalize',
                  filtroGenero === g ? 'bg-azul text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-azul hover:text-azul'
                )}>{g}</button>
            ))}
          </div>
        </div>

        {/* Grid de obras */}
        {cargando ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="rounded-2xl bg-gray-100 aspect-[2/3] animate-pulse" />)}
          </div>
        ) : obrasFiltradas.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Ticket size={56} className="mx-auto mb-4 opacity-30" />
            <h3 className="font-heading text-xl">No hay obras disponibles</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {obrasFiltradas.map(obra => (
              <Link key={obra.id} to={`/cartelera/${obra.id}`} className="card group overflow-hidden flex flex-col">
                <div className="relative aspect-[2/3] overflow-hidden bg-gray-100">
                  {obra.posterUrl
                    ? <img src={obra.posterUrl} alt={obra.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full bg-gradient-brand flex items-center justify-center"><Ticket size={48} className="text-white/40" /></div>
                  }
                  <div className="absolute top-3 left-3">
                    <BadgeDisponibilidad disponibles={obra.asientosDisponibles || 100} total={obra.asientosTotal || 100} />
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <span className="text-xs font-heading font-bold text-cyan uppercase tracking-wider">{obra.genero}</span>
                  <h3 className="font-display text-lg text-gray-900 mt-1 leading-tight">{obra.nombre}</h3>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2 flex-1">{obra.descripcion}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="font-heading font-bold text-azul">${obra.precioGeneral} USD</p>
                    <span className="text-xs font-heading font-bold text-azul">Ver más →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
