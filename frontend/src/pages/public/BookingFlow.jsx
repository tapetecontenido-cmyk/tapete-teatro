// src/pages/public/BookingFlow.jsx
// Flujo de compra de entradas — Tapete Teatro (4 pasos)
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { subirArchivo } from '../../utils/subirArchivo';
import { db, storage } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import SeatSelector from '../../components/public/SeatSelector';
import { CheckCircle, ChevronRight, Upload, Smartphone, Building2, X, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import DOMPurify from 'dompurify';
import toast from 'react-hot-toast';

const PASOS = ['Asientos', 'Tus datos', 'Pago', 'Confirmación'];

// ── Indicador de pasos ─────────────────────────────────────────────────
function StepIndicator({ pasoActual }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {PASOS.map((paso, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={clsx(
              'w-9 h-9 rounded-full flex items-center justify-center text-sm font-heading font-bold transition-all duration-300',
              i < pasoActual  ? 'bg-green-500 text-white' :
              i === pasoActual ? 'bg-azul text-white shadow-brand' :
                                 'bg-gray-200 text-gray-400'
            )}>
              {i < pasoActual ? <CheckCircle size={18} /> : i + 1}
            </div>
            <span className={clsx(
              'text-xs mt-1 font-heading font-bold hidden sm:block',
              i === pasoActual ? 'text-azul' : 'text-gray-400'
            )}>
              {paso}
            </span>
          </div>
          {i < PASOS.length - 1 && (
            <div className={clsx(
              'w-12 sm:w-20 h-0.5 mx-1 mb-4 transition-all duration-300',
              i < pasoActual ? 'bg-green-400' : 'bg-gray-200'
            )} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function BookingFlow() {
  const { obraId, funcionId } = useParams();
  const { user, perfil }      = useAuth();
  const navigate              = useNavigate();

  const [paso,          setPaso]          = useState(0);
  const [obra,          setObra]          = useState(null);
  const [funcion,       setFuncion]       = useState(null);
  const [configBanco,   setConfigBanco]   = useState(null);
  const [cargando,      setCargando]      = useState(true);
  const [enviando,      setEnviando]      = useState(false);
  const [reservaId,     setReservaId]     = useState('');

  // Estado del formulario
  const [seatsElegidos, setSeatsElegidos] = useState([]);
  const [datosComprador, setDatosComprador] = useState({
    nombre: '', cedula: '', telefono: '', email: ''
  });
  const [metodoPago,    setMetodoPago]    = useState('pago_movil'); // 'pago_movil' | 'transferencia'
  const [referencia,    setReferencia]    = useState('');
  const [comprobante,   setComprobante]   = useState(null);
  const [errores,       setErrores]       = useState({});

  // ── Cargar datos ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obra
        const obraSnap = await getDoc(doc(db, 'obras', obraId));
        if (!obraSnap.exists()) { navigate('/cartelera'); return; }
        setObra({ id: obraId, ...obraSnap.data() });

        // Función
        const funcionSnap = await getDoc(doc(db, 'obras', obraId, 'funciones', funcionId));
        if (funcionSnap.exists()) setFuncion({ id: funcionId, ...funcionSnap.data() });

        // Configuración bancaria
        const configSnap = await getDoc(doc(db, 'configuracion', 'bancario'));
        if (configSnap.exists()) setConfigBanco(configSnap.data());

        // Pre-rellenar datos si está logueado
        if (perfil) {
          setDatosComprador({
            nombre:   perfil.nombre   || '',
            cedula:   perfil.cedula   || '',
            telefono: perfil.telefono || '',
            email:    perfil.email    || user?.email || '',
          });
        }
      } catch (err) {
        console.error('Error:', err.message);
        toast.error('Error cargando información');
      } finally {
        setCargando(false);
      }
    };
    fetchData();
  }, [obraId, funcionId]);

  // ── Validaciones ───────────────────────────────────────────────────
  const validarPaso1 = () => {
    if (seatsElegidos.length === 0) {
      toast.error('Selecciona al menos un asiento');
      return false;
    }
    return true;
  };

  const validarPaso2 = () => {
    const errs = {};
    if (!datosComprador.nombre.trim())   errs.nombre   = 'Requerido';
    if (!datosComprador.cedula.trim())   errs.cedula   = 'Requerido';
    if (!datosComprador.telefono.trim()) errs.telefono = 'Requerido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datosComprador.email)) errs.email = 'Email inválido';
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const validarPaso3 = () => {
    if (!referencia.trim()) {
      toast.error('Ingresa el número de referencia del pago');
      return false;
    }
    if (!comprobante) {
      toast.error('Sube el comprobante de pago');
      return false;
    }
    return true;
  };

  // ── Calcular total ─────────────────────────────────────────────────
  const calcTotal = () => {
    let total = 0;
    const vipFilas = obra?.layoutConfig?.vipFilas || [];
    for (const seatId of seatsElegidos) {
      const fila = seatId[0];
      total += vipFilas.includes(fila) ? (obra?.precioVip || 0) : (obra?.precioGeneral || 0);
    }
    return total;
  };

  // ── Enviar reserva ─────────────────────────────────────────────────
  const enviarReserva = async () => {
    if (!validarPaso3()) return;
    setEnviando(true);

    try {
      // 1. Subir comprobante a Firebase Storage
      const comprobanteUrl = await subirArchivo(comprobante, 'comprobantes');;

      // 2. Sanitizar datos del comprador
      const compradorLimpio = {
        nombre:   DOMPurify.sanitize(datosComprador.nombre.trim()),
        cedula:   DOMPurify.sanitize(datosComprador.cedula.trim()),
        telefono: DOMPurify.sanitize(datosComprador.telefono.trim()),
        email:    datosComprador.email.trim().toLowerCase(),
      };

      // 3. Crear reserva en Firestore
      const reservaData = {
        userId:        user?.uid || null,
        obraId,
        obraназвание: obra.nombre,
        funcionId,
        asientos:      seatsElegidos,
        total:         calcTotal(),
        metodoPago,
        referencia:    DOMPurify.sanitize(referencia.trim()),
        comprobanteUrl,
        estado:        'pendiente',
        comprador:     compradorLimpio,
        creadoEn:      serverTimestamp(),
        actualizadoEn: serverTimestamp(),
        notaAdmin:     '',
      };

      const docRef = await addDoc(collection(db, 'reservas'), reservaData);
      setReservaId(docRef.id);

      // 4. Marcar asientos como reservados (provisional, hasta confirmación)
      await updateDoc(doc(db, 'asientosOcupados', funcionId), {
        reservados: arrayUnion(...seatsElegidos),
      }).catch(() => {
        // Si no existe, crear el documento
        return addDoc(collection(db, 'asientosOcupados'), {
          funcionId, reservados: seatsElegidos, ocupados: []
        });
      });

      // 5. Verificación automática via backend (opcional, si está activado)
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservas/verificar`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ reservaId: docRef.id, referencia, metodoPago }),
        });
        // Si falla, no importa — el admin verificará manualmente
      } catch {
        // Silencioso — fallback a verificación manual
      }

      setPaso(3);
      toast.success('¡Reserva enviada!');

    } catch (err) {
      console.error('Error enviando reserva:', err);
      toast.error('Error al enviar la reserva. Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const siguiente = () => {
    if (paso === 0 && validarPaso1()) setPaso(1);
    else if (paso === 1 && validarPaso2()) setPaso(2);
    else if (paso === 2) enviarReserva();
  };

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <div className="spinner w-10 h-10" />
    </div>
  );

  if (!obra) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-8">
          <button onClick={() => navigate(`/cartelera/${obraId}`)}
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-azul transition-colors mb-4">
            <X size={14} /> Cancelar compra
          </button>
          <h1 className="font-display text-display-sm text-gray-900">{obra.nombre}</h1>
          {funcion && (
            <p className="text-gray-500 text-sm mt-1 font-heading">
              {funcion.fechaTexto || 'Función disponible'}
            </p>
          )}
        </div>

        <StepIndicator pasoActual={paso} />

        {/* ── PASO 0: SELECCIÓN DE ASIENTOS ─────────────────────────── */}
        {paso === 0 && (
          <div className="card p-6 sm:p-8">
            <h2 className="font-heading font-bold text-xl text-gray-900 mb-6">
              Selecciona tus asientos
              <span className="text-sm text-gray-400 font-normal ml-2">(máx. 6)</span>
            </h2>
            <SeatSelector
              funcionId={funcionId}
              layoutConfig={obra.layoutConfig || {
                filas: 8, columnas: 12, vipFilas: ['A','B'], pasilloCol: 6, inhabilitados: []
              }}
              precioVip={obra.precioVip || 0}
              precioGeneral={obra.precioGeneral || 0}
              onChange={setSeatsElegidos}
              maxSeats={6}
            />
          </div>
        )}

        {/* ── PASO 1: DATOS DEL COMPRADOR ───────────────────────────── */}
        {paso === 1 && (
          <div className="card p-6 sm:p-8">
            <h2 className="font-heading font-bold text-xl text-gray-900 mb-6">Tus datos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { key: 'nombre',   label: 'Nombre completo', type: 'text',  placeholder: 'Juan Pérez' },
                { key: 'cedula',   label: 'Cédula / Pasaporte', type: 'text', placeholder: 'V-12345678' },
                { key: 'telefono', label: 'Teléfono', type: 'tel',   placeholder: '+58 424-000-0000' },
                { key: 'email',    label: 'Correo electrónico', type: 'email', placeholder: 'juan@email.com' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key} className={key === 'email' ? 'sm:col-span-2' : ''}>
                  <label className="label-field">{label}</label>
                  <input
                    type={type}
                    value={datosComprador[key]}
                    onChange={e => setDatosComprador(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className={clsx('input-field', errores[key] && 'border-red-400 focus:border-red-400')}
                  />
                  {errores[key] && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {errores[key]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Resumen */}
            <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-sm font-heading font-bold text-gray-700 mb-2">Resumen de compra</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {seatsElegidos.map(s => (
                  <span key={s} className="badge bg-azul/10 text-azul">{s}</span>
                ))}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{seatsElegidos.length} asiento{seatsElegidos.length > 1 ? 's' : ''}</span>
                <span className="font-heading font-bold text-azul text-lg">${calcTotal()} USD</span>
              </div>
            </div>
          </div>
        )}

        {/* ── PASO 2: PAGO ──────────────────────────────────────────── */}
        {paso === 2 && (
          <div className="card p-6 sm:p-8">
            <h2 className="font-heading font-bold text-xl text-gray-900 mb-6">Realizar pago</h2>

            {/* Total a pagar */}
            <div className="bg-gradient-brand text-white rounded-2xl p-5 mb-6 text-center">
              <p className="text-white/80 text-sm font-heading uppercase tracking-wide">Total a pagar</p>
              <p className="text-4xl font-bold" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>${calcTotal()} USD</p>
            </div>

            {/* Método de pago */}
            <div className="mb-6">
              <label className="label-field mb-3">Método de pago</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { val: 'pago_movil',     label: 'Pago Móvil',     icon: <Smartphone size={20} /> },
                  { val: 'transferencia',  label: 'Transferencia',   icon: <Building2  size={20} /> },
                ].map(({ val, label, icon }) => (
                  <button key={val}
                    onClick={() => setMetodoPago(val)}
                    className={clsx(
                      'flex items-center gap-3 p-4 rounded-xl border-2 transition-all font-heading font-bold text-sm',
                      metodoPago === val
                        ? 'border-azul bg-azul/5 text-azul'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}>
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Datos bancarios */}
            {configBanco && (
              <div className="bg-cyan/5 border border-cyan/20 rounded-xl p-5 mb-6">
                <p className="text-sm font-heading font-bold text-cyan uppercase tracking-wide mb-3">
                  Datos de pago — Tapete Teatro
                </p>
                {metodoPago === 'pago_movil' ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Banco:</span> <strong>{configBanco.pagoMovil?.banco}</strong></div>
                    <div className="flex justify-between"><span className="text-gray-500">Teléfono:</span> <strong>{configBanco.pagoMovil?.telefono}</strong></div>
                    <div className="flex justify-between"><span className="text-gray-500">Cédula:</span> <strong>{configBanco.pagoMovil?.cedula}</strong></div>
                    <div className="flex justify-between"><span className="text-gray-500">Nombre:</span> <strong>{configBanco.pagoMovil?.nombre}</strong></div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Banco:</span> <strong>{configBanco.transferencia?.banco}</strong></div>
                    <div className="flex justify-between"><span className="text-gray-500">Cuenta:</span> <strong>{configBanco.transferencia?.cuenta}</strong></div>
                    <div className="flex justify-between"><span className="text-gray-500">Titular:</span> <strong>{configBanco.transferencia?.titular}</strong></div>
                    <div className="flex justify-between"><span className="text-gray-500">RIF:</span> <strong>{configBanco.transferencia?.rif}</strong></div>
                  </div>
                )}
              </div>
            )}

            {/* Referencia */}
            <div className="mb-5">
              <label className="label-field">Número de referencia del pago</label>
              <input
                type="text"
                value={referencia}
                onChange={e => setReferencia(e.target.value)}
                placeholder="Ej: 000123456789"
                className="input-field"
                maxLength={30}
              />
            </div>

            {/* Subir comprobante */}
            <div>
              <label className="label-field">Comprobante de pago</label>
              <label className={clsx(
                'flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed',
                'cursor-pointer transition-all duration-200',
                comprobante
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 hover:border-azul hover:bg-azul/3'
              )}>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file && file.size > 5 * 1024 * 1024) {
                      toast.error('El archivo debe pesar máximo 5MB');
                      return;
                    }
                    setComprobante(file || null);
                  }}
                />
                {comprobante ? (
                  <>
                    <CheckCircle size={32} className="text-green-500" />
                    <p className="text-sm font-heading font-bold text-green-700">{comprobante.name}</p>
                    <p className="text-xs text-green-500">Clic para cambiar</p>
                  </>
                ) : (
                  <>
                    <Upload size={32} className="text-gray-400" />
                    <p className="text-sm font-heading font-bold text-gray-600">Subir comprobante</p>
                    <p className="text-xs text-gray-400">Imagen o PDF · máx. 5MB</p>
                  </>
                )}
              </label>
            </div>
          </div>
        )}

        {/* ── PASO 3: CONFIRMACIÓN ──────────────────────────────────── */}
        {paso === 3 && (
          <div className="card p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6
                            animate-pulse-brand">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="font-display text-display-sm text-gray-900 mb-3">¡Reserva enviada!</h2>
            <p className="text-gray-500 mb-4">Tu solicitud ha sido recibida correctamente.</p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">ID de reserva:</span>
                <span className="font-heading font-bold text-azul">#{reservaId.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estado:</span>
                <span className="badge badge-pending">Pendiente de verificación</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Asientos:</span>
                <span className="font-heading font-bold">{seatsElegidos.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total:</span>
                <span className="font-heading font-bold text-azul">${calcTotal()} USD</span>
              </div>
            </div>

            <div className="bg-cyan/5 border border-cyan/20 rounded-xl p-4 mb-6 text-sm text-gray-600">
              <p>Recibirás la confirmación por <strong>WhatsApp o correo electrónico</strong> en un
                 plazo de 24 horas hábiles una vez verificado el pago.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`https://wa.me/584242283471?text=Hola,%20tengo%20una%20reserva%20ID:%20${reservaId.slice(-8).toUpperCase()}`}
                target="_blank" rel="noopener noreferrer"
                className="btn-secondary gap-2"
              >
                <Smartphone size={18} />
                Confirmar por WhatsApp
              </a>
              <button onClick={() => navigate('/')} className="btn-outline">
                Volver al inicio
              </button>
            </div>
          </div>
        )}

        {/* Botones de navegación */}
        {paso < 3 && (
          <div className="flex justify-between mt-6 gap-4">
            {paso > 0 ? (
              <button onClick={() => setPaso(p => p - 1)}
                className="btn-outline py-3 px-6">
                ← Anterior
              </button>
            ) : (
              <button onClick={() => navigate(-1)}
                className="btn-ghost py-3 px-6 text-gray-500">
                Cancelar
              </button>
            )}
            <button
              onClick={siguiente}
              disabled={enviando}
              className="btn-primary py-3 px-8 flex-1 max-w-xs justify-center"
            >
              {enviando ? (
                <span className="flex items-center gap-2">
                  <span className="spinner w-5 h-5" /> Enviando...
                </span>
              ) : paso === 2 ? (
                <span className="flex items-center gap-2">
                  Enviar reserva <CheckCircle size={18} />
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Continuar <ChevronRight size={18} />
                </span>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
