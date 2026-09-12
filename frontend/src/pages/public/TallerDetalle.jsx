// src/pages/public/TallerDetalle.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, BookOpen, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';

export default function TallerDetalle() {
  const { tallerId } = useParams();
  const navigate     = useNavigate();
  const { user, perfil } = useAuth();

  const [taller,       setTaller]       = useState(null);
  const [cargando,     setCargando]     = useState(true);
  const [modal,        setModal]        = useState(false);
  const [enviando,     setEnviando]     = useState(false);
  const [exito,        setExito]        = useState(false);
  const [yaInscrito,   setYaInscrito]   = useState(false);
  const [estadoActual, setEstadoActual] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDoc(doc(db, 'talleres', tallerId));
      if (!snap.exists()) { navigate('/talleres'); return; }
      setTaller({ id: tallerId, ...snap.data() });

      // Verificar si ya tiene una inscripción a este taller
      if (user) {
        const q = query(
          collection(db, 'inscripciones'),
          where('userId', '==', user.uid),
          where('tallerId', '==', tallerId)
        );
        const insSnap = await getDocs(q);
        if (!insSnap.empty) {
          setYaInscrito(true);
          setEstadoActual(insSnap.docs[0].data().estado);
        }
      }
      setCargando(false);
    };
    fetch();
  }, [tallerId, user]);

  const handleInscribirse = () => {
    if (!user) { navigate('/login'); return; }
    setModal(true);
  };

  const handleEnviar = async () => {
    setEnviando(true);
    try {
      await addDoc(collection(db, 'inscripciones'), {
        userId:       user.uid,
        tallerId,
        tallerNombre: taller.nombre,
        alumno: {
          nombre:   DOMPurify.sanitize(perfil?.nombre || ''),
          email:    perfil?.email || user.email,
          cedula:   perfil?.cedula || '',
          telefono: perfil?.telefono || '',
        },
        estado:   'pendiente',
        creadoEn: serverTimestamp(),
      });

      setExito(true);
      setYaInscrito(true);
      setEstadoActual('pendiente');
      toast.success('¡Solicitud de inscripción enviada!');
    } catch { toast.error('Error al enviar la solicitud'); }
    finally { setEnviando(false); }
  };

  if (cargando) return <div className="min-h-screen flex items-center justify-center pt-20"><div className="spinner w-10 h-10" /></div>;
  if (!taller) return null;

  const BadgeEstado = () => {
    if (estadoActual === 'pendiente') return (
      <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl p-4 text-orange-700">
        <Clock size={20} className="flex-shrink-0" />
        <div>
          <p className="font-heading font-bold text-sm">Solicitud pendiente</p>
          <p className="text-xs text-orange-600 mt-0.5">Tu inscripción está siendo revisada por el equipo.</p>
        </div>
      </div>
    );
    if (estadoActual === 'aprobada') return (
  <button onClick={() => navigate('/camerino')}
    className="w-full flex items-center gap-3 bg-green-50 border-2 border-green-200 rounded-xl p-4 text-green-700 hover:bg-green-100 transition-colors text-left">
    <CheckCircle size={22} className="flex-shrink-0" />
    <div className="flex-1">
      <p className="font-heading font-bold text-sm">¡Ya estás inscrito!</p>
      <p className="text-xs text-green-600 mt-0.5">Clic para ir a tu Camerino →</p>
    </div>
  </button>
);
    if (estadoActual === 'rechazada') return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
        <p className="font-heading font-bold text-sm">Solicitud no aprobada</p>
        <p className="text-xs text-red-600 mt-0.5">Contáctanos por WhatsApp para más información.</p>
      </div>
    );
    return null;
  };

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="bg-gradient-brand text-white py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => navigate('/talleres')} className="flex items-center gap-2 text-white/70 hover:text-white mb-6 text-sm font-heading">
            <ArrowLeft size={16} /> Volver a Talleres
          </button>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center"><BookOpen size={26} className="text-white" /></div>
            <div>
              <span className="badge bg-white/20 text-white">{taller.nivel}</span>
              <h1 className="font-display text-display-sm mt-1">{taller.nombre}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="font-heading font-bold text-gray-900 text-lg mb-3">Descripción</h2>
              <p className="text-gray-600 leading-relaxed">{taller.descripcion}</p>
            </div>
            <div className="card p-6 grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Horario',    val: taller.horario },
                { label: 'Duración',   val: taller.duracion },
                { label: 'Nivel',      val: taller.nivel },
                { label: 'Cupo máx.',  val: taller.cupoMaximo ? `${taller.cupoMaximo} alumnos` : '—' },
                { label: 'Profesor',   val: taller.profesorNombre },
              ].filter(r => r.val).map(({ label, val }) => (
                <div key={label}><p className="text-gray-400 text-xs font-heading uppercase tracking-wide">{label}</p><p className="font-heading font-bold text-gray-900 mt-0.5">{val}</p></div>
              ))}
            </div>
          </div>
          <div>
            <div className="card p-6 sticky top-24">
              {taller.precio > 0 && (
                <>
                  <p className="text-3xl text-azul mb-1" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                    ${taller.precio} <span className="text-sm font-body font-normal text-gray-400">USD/mes</span>
                  </p>
                  <p className="text-gray-500 text-sm mb-5">Pago mensual · Incluye materiales</p>
                </>
              )}

              {yaInscrito ? (
                <BadgeEstado />
              ) : (
                <>
                  <button onClick={handleInscribirse} className="btn-primary w-full py-3.5 text-base">
                    Solicitar inscripción
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-3">Tu solicitud será revisada por el equipo de Tapete Teatro</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de inscripción */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal-container p-6" onClick={e => e.stopPropagation()}>
            {exito ? (
              <div className="text-center py-8">
                <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
                <h2 className="font-display text-2xl text-gray-900 mb-2">¡Solicitud enviada!</h2>
                <p className="text-gray-500 mb-6">Te notificaremos cuando tu inscripción sea aprobada.</p>
                <button onClick={() => { setModal(false); setExito(false); }} className="btn-primary">Cerrar</button>
              </div>
            ) : (
              <>
                <h2 className="font-heading font-bold text-xl text-gray-900 mb-2">Solicitar inscripción</h2>
                <p className="text-gray-500 text-sm mb-5">{taller.nombre}</p>

                <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">Nombre:</span><strong className="text-gray-900">{perfil?.nombre}</strong></div>
                  <div className="flex justify-between"><span className="text-gray-400">Email:</span><strong className="text-gray-900">{perfil?.email || user?.email}</strong></div>
                  {perfil?.telefono && <div className="flex justify-between"><span className="text-gray-400">Teléfono:</span><strong className="text-gray-900">{perfil.telefono}</strong></div>}
                </div>

                <p className="text-xs text-gray-400 mb-5">
                  Al enviar tu solicitud, el equipo de Tapete Teatro la revisará y te contactará para coordinar los detalles de pago e inicio.
                </p>

                <div className="flex gap-3">
                  <button onClick={() => setModal(false)} className="btn-outline flex-1 py-3">Cancelar</button>
                  <button onClick={handleEnviar} disabled={enviando} className="btn-primary flex-1 py-3">
                    {enviando ? <span className="spinner w-5 h-5" /> : 'Enviar solicitud'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
