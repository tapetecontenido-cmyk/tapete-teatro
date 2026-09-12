// src/pages/auth/Camerino.jsx
// Espacio de contenido para alumnos inscritos en talleres
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, FileText, Link2, MessageSquare, Lock, Download, ExternalLink, Drama } from 'lucide-react';
import { clsx } from 'clsx';

const ICONOS_TIPO = { mensaje: MessageSquare, pdf: FileText, video: Link2 };

export default function Camerino() {
  const { user } = useAuth();
  const [talleres,      setTalleres]      = useState([]);
  const [tallerActivo,  setTallerActivo]  = useState(null);
  const [materiales,    setMateriales]    = useState([]);
  const [cargando,      setCargando]      = useState(true);
  const [cargandoMat,   setCargandoMat]   = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!user) { setCargando(false); return; }
      try {
        const insSnap = await getDocs(query(
          collection(db, 'inscripciones'),
          where('userId', '==', user.uid),
          where('estado', '==', 'aprobada')
        ));

        const talleresData = [];
        for (const insDoc of insSnap.docs) {
          const ins = insDoc.data();
          const tallerSnap = await getDoc(doc(db, 'talleres', ins.tallerId));
          if (tallerSnap.exists()) {
            talleresData.push({ id: ins.tallerId, ...tallerSnap.data() });
          }
        }
        setTalleres(talleresData);
        if (talleresData.length > 0) abrirTaller(talleresData[0].id);
      } catch (err) {
        console.error('Error cargando camerino:', err.message);
      } finally {
        setCargando(false);
      }
    };
    fetch();
  }, [user]);

  const abrirTaller = async (tallerId) => {
    setTallerActivo(tallerId);
    setCargandoMat(true);
    try {
      const matSnap = await getDocs(query(
        collection(db, 'talleres', tallerId, 'materiales'),
        where('desbloqueado', '==', true),
        orderBy('orden', 'asc')
      ));
      setMateriales(matSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error cargando materiales:', err.message);
      setMateriales([]);
    } finally {
      setCargandoMat(false);
    }
  };

  const tallerSeleccionado = talleres.find(t => t.id === tallerActivo);

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <div className="spinner w-10 h-10" />
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center">
            <Drama size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-display-sm text-gray-900">Camerino</h1>
            <p className="text-gray-500 text-sm">Tu espacio de contenido y materiales</p>
          </div>
        </div>

        {talleres.length === 0 ? (
          <div className="card p-10 text-center">
            <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
            <h2 className="font-heading font-bold text-gray-900 text-lg mb-2">Aún no tienes talleres activos</h2>
            <p className="text-gray-500 text-sm mb-6">
              Cuando tu inscripción a un taller sea aprobada, aparecerá aquí con todo su contenido.
            </p>
            <Link to="/talleres" className="btn-primary inline-flex">Ver talleres disponibles</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">

            {/* Sidebar de talleres */}
            <div className="lg:col-span-1">
              <p className="text-xs font-heading font-bold text-gray-400 uppercase tracking-wide mb-3">
                Mis talleres ({talleres.length})
              </p>
              <div className="space-y-2">
                {talleres.map(t => (
                  <button key={t.id} onClick={() => abrirTaller(t.id)}
                    className={clsx(
                      'w-full text-left p-4 rounded-xl border-2 transition-all',
                      tallerActivo === t.id
                        ? 'border-azul bg-azul/5'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    )}>
                    <p className={clsx('font-heading font-bold text-sm', tallerActivo === t.id ? 'text-azul' : 'text-gray-900')}>
                      {t.nombre}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.profesorNombre || 'Sin profesor asignado'}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Contenido del taller */}
            <div className="lg:col-span-3">
              {tallerSeleccionado && (
                <div className="card p-6 mb-5">
                  <h2 className="font-heading font-bold text-xl text-gray-900">{tallerSeleccionado.nombre}</h2>
                  <p className="text-gray-500 text-sm mt-1">{tallerSeleccionado.horario} · Prof. {tallerSeleccionado.profesorNombre || '—'}</p>
                </div>
              )}

              {cargandoMat ? (
                <div className="flex justify-center py-16"><div className="spinner w-8 h-8" /></div>
              ) : materiales.length === 0 ? (
                <div className="card p-10 text-center">
                  <Lock size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 font-heading">Aún no hay contenido disponible en este taller.</p>
                  <p className="text-gray-400 text-sm mt-1">Tu profesor lo irá agregando a medida que avance el curso.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {materiales.map(m => {
                    const Icono = ICONOS_TIPO[m.tipo] || FileText;
                    return (
                      <div key={m.id} className="card p-5">
                        <div className="flex items-start gap-4">
                          <div className="w-11 h-11 rounded-xl bg-azul/10 flex items-center justify-center flex-shrink-0">
                            <Icono size={20} className="text-azul" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-heading font-bold text-gray-900">{m.titulo}</p>

                            {m.tipo === 'mensaje' && (
                              <p className="text-gray-600 text-sm mt-2 whitespace-pre-wrap">{m.contenido}</p>
                            )}

                            {m.tipo === 'pdf' && (
                              <a href={m.contenido} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 mt-3 text-sm text-azul hover:text-azul-dark font-heading font-bold">
                                <Download size={15} /> Descargar PDF
                              </a>
                            )}

                            {m.tipo === 'video' && (
                              <a href={m.contenido} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 mt-3 text-sm text-azul hover:text-azul-dark font-heading font-bold">
                                <ExternalLink size={15} /> Ver contenido
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
