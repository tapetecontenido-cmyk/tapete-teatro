// src/pages/public/Noticias.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx } from 'clsx';

const CATEGORIAS = ['Todas', 'Anuncios', 'Premios', 'Artículos', 'Estrenos', 'Talleres', 'Comunidad'];

export default function Noticias() {
  const [noticias,  setNoticias]  = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [categoria, setCategoria] = useState('Todas');

  useEffect(() => {
    getDocs(query(collection(db, 'noticias'), where('publicado', '==', true), orderBy('fecha', 'desc')))
      .then(snap => { setNoticias(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setCargando(false); });
  }, []);

  const filtradas = categoria === 'Todas' ? noticias : noticias.filter(n => n.categoria === categoria);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="bg-gradient-brand text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-white/70 text-sm font-heading uppercase tracking-widest mb-2">Tapete Teatro</p>
          <h1 className="font-display text-display-md mb-3">Noticias</h1>
          <div className="w-16 h-1 bg-white/30 rounded-full" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIAS.map(c => (
            <button key={c} onClick={() => setCategoria(c)}
              className={clsx('px-4 py-2 rounded-xl text-sm font-heading font-bold transition-all',
                categoria === c ? 'bg-azul text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-azul hover:text-azul'
              )}>{c}</button>
          ))}
        </div>

        {cargando ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-20 text-gray-400"><Star size={56} className="mx-auto mb-4 opacity-30" /><h3 className="font-heading text-xl">Sin noticias en esta categoría</h3></div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtradas.map(n => (
              <Link key={n.id} to={`/noticias/${n.id}`} className="card group overflow-hidden">
                <div className="aspect-video overflow-hidden bg-gray-100">
                  {n.imagenUrl
                    ? <img src={n.imagenUrl} alt={n.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full bg-gradient-subtle flex items-center justify-center"><Star size={32} className="text-azul/30" /></div>
                  }
                </div>
                <div className="p-5">
                  <span className="text-xs font-heading font-bold text-cyan uppercase tracking-wider">{n.categoria}</span>
                  <h3 className="font-heading font-bold text-gray-900 text-lg mt-1 leading-tight group-hover:text-azul transition-colors line-clamp-2">{n.titulo}</h3>
                  <p className="text-gray-500 text-sm mt-2 line-clamp-2">{n.resumen}</p>
                  <p className="text-xs text-gray-400 mt-3">
                    {n.autor && <span>{n.autor} · </span>}
                    {n.fecha && format(n.fecha.toDate?.() || new Date(n.fecha), "d MMM yyyy", { locale: es })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
