// src/pages/public/NoticiaDetalle.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NoticiaDetalle() {
  const { noticiaId } = useParams();
  const navigate      = useNavigate();
  const [noticia,     setNoticia]     = useState(null);
  const [relacionadas, setRelacionadas] = useState([]);
  const [cargando,    setCargando]    = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDoc(doc(db, 'noticias', noticiaId));
      if (!snap.exists()) { navigate('/noticias'); return; }
      const data = { id: noticiaId, ...snap.data() };
      setNoticia(data);

      // Artículos relacionados
      const relSnap = await getDocs(query(
        collection(db, 'noticias'),
        where('publicado', '==', true),
        where('categoria', '==', data.categoria),
        orderBy('fecha', 'desc'),
        limit(4)
      ));
      setRelacionadas(relSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(n => n.id !== noticiaId));
      setCargando(false);
    };
    fetch();
  }, [noticiaId]);

  if (cargando) return <div className="min-h-screen flex items-center justify-center pt-20"><div className="spinner w-10 h-10" /></div>;
  if (!noticia) return null;

  return (
    <div className="min-h-screen pt-20 pb-16">
      {/* Hero imagen */}
      <div className="relative h-80 md:h-96 overflow-hidden bg-gray-200">
        {noticia.imagenUrl && <img src={noticia.imagenUrl} alt={noticia.titulo} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
            <button onClick={() => navigate('/noticias')} className="flex items-center gap-2 text-white/70 hover:text-white mb-4 text-sm font-heading">
              <ArrowLeft size={16} /> Volver a Noticias
            </button>
            <span className="badge bg-cyan text-white mb-3">{noticia.categoria}</span>
            <h1 className="font-display text-3xl md:text-4xl text-white leading-tight">{noticia.titulo}</h1>
            <p className="text-white/70 text-sm mt-2 font-heading">
              {noticia.autor && <span>{noticia.autor} · </span>}
              {noticia.fecha && format(noticia.fecha.toDate?.() || new Date(noticia.fecha), "d 'de' MMMM yyyy", { locale: es })}
            </p>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div
          className="rich-content"
          dangerouslySetInnerHTML={{ __html: noticia.contenidoHtml || noticia.resumen || '' }}
        />

        {/* Artículos relacionados */}
        {relacionadas.length > 0 && (
          <div className="mt-14 pt-10 border-t border-gray-200">
            <h2 className="font-heading font-bold text-gray-900 text-xl mb-6">Artículos relacionados</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {relacionadas.slice(0, 3).map(n => (
                <Link key={n.id} to={`/noticias/${n.id}`} className="card group p-4">
                  {n.imagenUrl && <img src={n.imagenUrl} alt={n.titulo} className="w-full aspect-video object-cover rounded-xl mb-3 group-hover:opacity-90 transition-opacity" />}
                  <span className="text-xs font-heading font-bold text-cyan uppercase tracking-wide">{n.categoria}</span>
                  <h3 className="font-heading font-bold text-gray-900 text-sm mt-1 line-clamp-2 group-hover:text-azul transition-colors">{n.titulo}</h3>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
