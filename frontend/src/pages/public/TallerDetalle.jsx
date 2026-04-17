// src/pages/public/TallerDetalle.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { subirArchivo } from '../../utils/subirArchivo';
import { db, storage } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, BookOpen, CheckCircle, Upload, Smartphone, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';

export default function TallerDetalle() {
  const { tallerId } = useParams();
  const navigate     = useNavigate();
  const { user, perfil } = useAuth();
  const [taller,    setTaller]    = useState(null);
  const [cargando,  setCargando]  = useState(true);
  const [modal,     setModal]     = useState(false);
  const [enviando,  setEnviando]  = useState(false);
  const [exito,     setExito]     = useState(false);
  const [configBanco, setConfigBanco] = useState(null);
  const [metodoPago,  setMetodoPago]  = useState('pago_movil');
  const [referencia,  setReferencia]  = useState('');
  const [comprobante, setComprobante] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDoc(doc(db, 'talleres', tallerId));
      if (!snap.exists()) { navigate('/talleres'); return; }
      setTaller({ id: tallerId, ...snap.data() });
      const cfgSnap = await getDoc(doc(db, 'configuracion', 'bancario'));
      if (cfgSnap.exists()) setConfigBanco(cfgSnap.data());
      setCargando(false);
    };
    fetch();
  }, [tallerId]);

  const handleInscribirse = () => {
    if (!user) { navigate('/login'); return; }
    setModal(true);
  };

  const handleEnviar = async () => {
    if (!referencia.trim() || !comprobante) { toast.error('Completa todos los campos'); return; }
    setEnviando(true);
    try {
      const url = await subirArchivo(comprobante, 'comprobantes');

      await addDoc(collection(db, 'inscripciones'), {
        userId:     user.uid,
        tallerId,
        tallerNombre: taller.nombre,
        comprador:  { nombre: DOMPurify.sanitize(perfil?.nombre || ''), email: perfil?.email || user.email, cedula: perfil?.cedula || '', telefono: perfil?.telefono || '' },
        metodoPago, referencia: DOMPurify.sanitize(referencia.trim()),
        comprobanteUrl: url,
        estado:     'pendiente',
        creadoEn:   serverTimestamp(),
      });

      setExito(true);
      toast.success('¡Inscripción enviada!');
    } catch { toast.error('Error al enviar'); }
    finally { setEnviando(false); }
  };

  if (cargando) return <div className="min-h-screen flex items-center justify-center pt-20"><div className="spinner w-10 h-10" /></div>;
  if (!taller) return null;

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
              <p className="font-display text-3xl text-azul mb-1">${taller.precio} <span className="text-sm font-body font-normal text-gray-400">USD/mes</span></p>
              <p className="text-gray-500 text-sm mb-5">Pago mensual · Incluye materiales</p>
              <button onClick={handleInscribirse} className="btn-primary w-full py-3.5 text-base">
                Inscribirse ahora
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">Cupos limitados disponibles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de inscripción */}
      {modal && (
        <div className="modal-overlay" onClick={() => !exito && setModal(false)}>
          <div className="modal-container p-6" onClick={e => e.stopPropagation()}>
            {exito ? (
              <div className="text-center py-8">
                <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
                <h2 className="font-display text-2xl text-gray-900 mb-2">¡Inscripción enviada!</h2>
                <p className="text-gray-500 mb-6">Tu solicitud está pendiente de verificación.</p>
                <button onClick={() => { setModal(false); setExito(false); }} className="btn-primary">Cerrar</button>
              </div>
            ) : (
              <>
                <h2 className="font-heading font-bold text-xl text-gray-900 mb-4">Inscribirse — {taller.nombre}</h2>
                <div className="bg-gradient-brand text-white rounded-xl p-4 text-center mb-5">
                  <p className="text-white/70 text-sm">Total a pagar</p>
                  <p className="font-display text-3xl">${taller.precio} USD</p>
                </div>
                <div className="mb-4">
                  <label className="label-field">Método de pago</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[['pago_movil', 'Pago Móvil', Smartphone], ['transferencia', 'Transferencia', Building2]].map(([val, label, Icon]) => (
                      <button key={val} onClick={() => setMetodoPago(val)}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 font-heading font-bold text-sm transition-all ${metodoPago === val ? 'border-azul bg-azul/5 text-azul' : 'border-gray-200 text-gray-600'}`}>
                        <Icon size={16} />{label}
                      </button>
                    ))}
                  </div>
                </div>
                {configBanco && (
                  <div className="bg-cyan/5 border border-cyan/20 rounded-xl p-4 mb-4 text-sm space-y-1">
                    {metodoPago === 'pago_movil'
                      ? Object.entries(configBanco.pagoMovil || {}).map(([k, v]) => <div key={k} className="flex justify-between"><span className="text-gray-400 capitalize">{k}:</span> <strong>{v}</strong></div>)
                      : Object.entries(configBanco.transferencia || {}).map(([k, v]) => <div key={k} className="flex justify-between"><span className="text-gray-400 capitalize">{k}:</span> <strong>{v}</strong></div>)
                    }
                  </div>
                )}
                <div className="mb-4">
                  <label className="label-field">Número de referencia</label>
                  <input type="text" value={referencia} onChange={e => setReferencia(e.target.value)} className="input-field" placeholder="Ej: 000123456" maxLength={30} />
                </div>
                <div className="mb-5">
                  <label className="label-field">Comprobante de pago</label>
                  <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer hover:border-azul transition-colors">
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => setComprobante(e.target.files?.[0] || null)} />
                    {comprobante ? <><CheckCircle size={24} className="text-green-500" /><span className="text-sm text-green-600 font-heading">{comprobante.name}</span></> : <><Upload size={24} className="text-gray-400" /><span className="text-sm text-gray-400">Subir comprobante</span></>}
                  </label>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setModal(false)} className="btn-outline flex-1 py-3">Cancelar</button>
                  <button onClick={handleEnviar} disabled={enviando} className="btn-primary flex-1 py-3">
                    {enviando ? <span className="spinner w-5 h-5" /> : 'Enviar inscripción'}
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
