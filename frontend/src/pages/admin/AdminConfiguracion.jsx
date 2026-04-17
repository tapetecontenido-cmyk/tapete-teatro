// src/pages/admin/AdminConfiguracion.jsx
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Save, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

 const F = ({ label, value, onChange, placeholder, type = 'text' }) => (
    <div>
      <label className="label-field">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="input-field" />
    </div>
  );

export default function AdminConfiguracion() {
  const [config, setConfig] = useState({
    pagoMovil:    { banco: '', telefono: '', cedula: '', nombre: '' },
    transferencia: { banco: '', cuenta: '', titular: '', rif: '' },
    verificacionAutomatica: false,
  });
  const [apiKey, setApiKey]    = useState('');
  const [showKey, setShowKey]  = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'configuracion', 'bancario')).then(snap => {
      if (snap.exists()) setConfig(snap.data());
    });
  }, []);

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await setDoc(doc(db, 'configuracion', 'bancario'), config);

      // Si se proporcionó API Key, enviarla al backend para que la guarde en .env (vía endpoint seguro)
      if (apiKey) {
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/config/apikey`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey }),
        }).catch(() => {}); // Si falla, el admin deberá actualizarla manualmente en Railway
      }

      toast.success('Configuración guardada');
    } catch { toast.error('Error al guardar'); }
    finally { setGuardando(false); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-display-sm text-gray-900">Configuración</h1>
        <p className="text-gray-500 text-sm mt-1">Datos bancarios y métodos de verificación de pagos</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pago Móvil */}
        <div className="card p-6">
          <h2 className="font-heading font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
            📱 Pago Móvil
          </h2>
          <div className="space-y-4">
            <F label="Banco" value={config.pagoMovil.banco} onChange={e => setConfig(p => ({...p, pagoMovil: {...p.pagoMovil, banco: e.target.value}}))} placeholder="Banco de Venezuela" />
            <F label="Teléfono" value={config.pagoMovil.telefono} onChange={e => setConfig(p => ({...p, pagoMovil: {...p.pagoMovil, telefono: e.target.value}}))} placeholder="0424-0000000" />
            <F label="Rif" value={config.pagoMovil.cedula} onChange={e => setConfig(p => ({...p, pagoMovil: {...p.pagoMovil, cedula: e.target.value}}))} placeholder="V-12345678" />
            <F label="Nombre del titular" value={config.pagoMovil.nombre} onChange={e => setConfig(p => ({...p, pagoMovil: {...p.pagoMovil, nombre: e.target.value}}))} placeholder="Nombre Apellido" />
          </div>
        </div>

        {/* Transferencia */}
        <div className="card p-6">
          <h2 className="font-heading font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
            🏦 Transferencia Bancaria
          </h2>
          <div className="space-y-4">
            <F label="Banco" value={config.transferencia.banco} onChange={e => setConfig(p => ({...p, transferencia: {...p.transferencia, banco: e.target.value}}))} placeholder="Banesco" />
            <F label="Número de cuenta" value={config.transferencia.cuenta} onChange={e => setConfig(p => ({...p, transferencia: {...p.transferencia, cuenta: e.target.value}}))} placeholder="0134-0000-00-0000000000" />
            <F label="Titular" value={config.transferencia.titular} onChange={e => setConfig(p => ({...p, transferencia: {...p.transferencia, titular: e.target.value}}))} placeholder="Nombre de la empresa" />
            <F label="RIF" value={config.transferencia.rif} onChange={e => setConfig(p => ({...p, transferencia: {...p.transferencia, rif: e.target.value}}))} placeholder="J-00000000-0" />
          </div>
        </div>

        {/* Verificación de pagos */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="font-heading font-bold text-lg text-gray-900 mb-4">⚡ Verificación de Pagos</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  id="verificacion-auto"
                  checked={config.verificacionAutomatica}
                  onChange={e => setConfig(p => ({...p, verificacionAutomatica: e.target.checked}))}
                  className="w-4 h-4 accent-azul"
                />
                <label htmlFor="verificacion-auto" className="font-heading font-bold text-gray-800 cursor-pointer">
                  Activar verificación automática (VerificaPago.com)
                </label>
              </div>
              <p className="text-gray-500 text-sm">
                Si está activado, el sistema verificará los pagos automáticamente usando la API de VerificaPago.com.
                Si falla, se usa verificación manual.
              </p>
            </div>

            <div>
              <label className="label-field">API Key de VerificaPago.com</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="Dejar vacío para mantener la actual"
                  className="input-field pr-12"
                />
                <button type="button" onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">La clave se guarda en las variables de entorno del servidor, nunca en la base de datos.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={handleGuardar} disabled={guardando} className="btn-primary gap-2 py-3.5 px-8">
          {guardando ? <span className="spinner w-5 h-5" /> : <><Save size={18} /> Guardar configuración</>}
        </button>
      </div>
    </div>
  );
}
