// src/pages/public/ObraDetalle.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, Users, Ticket, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ObraDetalle() {
  const { obraId } = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const [obra,      setObra]      = useState(null);
  const [funciones, setFunciones] = useState([]);
  const [cargando,  setCargando]  = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const obraDoc = await getDoc(doc(db, 'obras', obraId));
      if (!obraDoc.exists()) { navigate('/cartelera'); return; }
      setObra({ id: obraId, ...obraDoc.data() });

      const funcSnap = await getDocs(query(collection(db, 'obras', obraId, 'funciones'), orderBy('fecha')));
      setFunciones(funcSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCargando(false);
    };
    fetch();
  }, [obraId]);

  if (cargando) return <div className="min-h-screen flex items-center justify-center pt-20"><div className="spinner w-10 h-10" /></div>;
  if (!obra) return null;

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-brand text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button onClick={() => navigate('/cartelera')} className="flex items-center gap-2 text-white/70 hover:text-white mb-6 text-sm font-heading">
            <ArrowLeft size={16} /> Volver a Cartelera
          </button>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              {obra.posterUrl
                ? <img src={obra.posterUrl} alt={obra.nombre} className="rounded-2xl w-full shadow-2xl" />
                : <div className="rounded-2xl bg-white/20 aspect-[2/3] flex items-center justify-center"><Ticket size={64} className="text-white/40" /></div>
              }
            </div>
            <div className="md:col-span-2">
              <span className="badge bg-white/20 text-white mb-3">{obra.genero}</span>
              <h1 className="font-display text-display-md mb-4">{obra.nombre}</h1>
              <p className="text-white/80 text-lg leading-relaxed mb-6">{obra.descripcion}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {obra.director && <div><span className="text-white/60">Director:</span><p className="font-heading font-bold">{obra.director}</p></div>}
                {obra.duracion && <div><span className="text-white/60">Duración:</span><p className="font-heading font-bold">{obra.duracion} min</p></div>}
                {obra.reparto && <div className="col-span-2"><span className="text-white/60">Reparto:</span><p className="font-heading font-bold">{obra.reparto}</p></div>}
              </div>
              <div className="mt-6 flex gap-4">
                <div className="bg-white/15 rounded-xl p-4"><p className="text-white/60 text-xs">Precio General</p><p className="font-display text-2xl">${obra.precioGeneral} USD</p></div>
                {obra.precioVip && <div className="bg-yellow-400/20 rounded-xl p-4"><p className="text-white/60 text-xs">Precio VIP</p><p className="font-display text-2xl">${obra.precioVip} USD</p></div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Funciones */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="font-display text-display-sm text-gray-900 mb-6">Funciones disponibles</h2>
        {funciones.length === 0
          ? <p className="text-gray-400 font-heading">No hay funciones programadas actualmente.</p>
          : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {funciones.map(f => (
                <div key={f.id} className="card p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar size={20} className="text-azul" />
                    <div>
                      <p className="font-heading font-bold text-gray-900">
                        {f.fecha && format(f.fecha.toDate?.() || new Date(f.fecha), "EEEE d 'de' MMMM", { locale: es })}
                      </p>
                      <p className="text-sm text-gray-500">{f.hora}</p>
                    </div>
                  </div>
                  {f.asientosDisponibles !== undefined && (
                    <p className="text-xs text-gray-400 mb-4">{f.asientosDisponibles} asientos disponibles</p>
                  )}
                  <button
                    onClick={() => {
                      if (!user) { navigate('/login'); return; }
                      navigate(`/cartelera/${obraId}/reservar/${f.id}`);
                    }}
                    disabled={f.asientosDisponibles === 0}
                    className="btn-primary w-full text-sm py-2.5"
                  >
                    {f.asientosDisponibles === 0 ? 'Agotado' : 'Comprar entradas'}
                  </button>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}
