// src/components/common/AvisoVerificacion.jsx
// Banner que avisa si el email del usuario no está verificado
import { useState } from 'react';
import { Mail, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function AvisoVerificacion() {
  const { user, emailVerificado, reenviarVerificacion } = useAuth();
  const [cerrado, setCerrado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  if (!user || emailVerificado || cerrado) return null;

  const handleReenviar = async () => {
    setEnviando(true);
    try {
      await reenviarVerificacion();
      toast.success('Correo de verificación reenviado');
    } catch {
      toast.error('Error al reenviar. Intenta de nuevo en unos minutos.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
      <Mail size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-heading font-bold text-amber-800">Verifica tu correo electrónico</p>
        <p className="text-xs text-amber-700 mt-0.5">
          Te enviamos un enlace de verificación a <strong>{user.email}</strong>. Revisa tu bandeja de entrada (y spam).
        </p>
        <button onClick={handleReenviar} disabled={enviando}
          className="text-xs font-heading font-bold text-amber-800 underline hover:text-amber-900 mt-2">
          {enviando ? 'Enviando...' : 'Reenviar correo'}
        </button>
      </div>
      <button onClick={() => setCerrado(true)} className="text-amber-400 hover:text-amber-600 flex-shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}
