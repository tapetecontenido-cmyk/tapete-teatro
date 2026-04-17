// src/pages/auth/RecuperarPass.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RecuperarPass() {
  const { recuperarPassword } = useAuth();
  const [email,    setEmail]    = useState('');
  const [enviado,  setEnviado]  = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setCargando(true);
    try {
      await recuperarPassword(email);
      setEnviado(true);
    } catch (err) {
      toast.error(err.code === 'auth/user-not-found' ? 'No existe una cuenta con ese correo.' : 'Error al enviar el correo.');
    } finally { setCargando(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 pb-10 px-4">
      <div className="w-full max-w-md">
        <div className="card p-8 sm:p-10">
          {enviado ? (
            <div className="text-center py-4">
              <CheckCircle size={52} className="text-green-500 mx-auto mb-4" />
              <h1 className="font-display text-2xl text-gray-900 mb-2">¡Correo enviado!</h1>
              <p className="text-gray-500 text-sm mb-6">Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.</p>
              <Link to="/login" className="btn-primary w-full justify-center py-3">Volver al inicio de sesión</Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
  <img src="/logo-tapete-isotipo.png" alt="Tapete Teatro" className="h-16 w-auto mx-auto mb-4" />
  <h1 className="font-display text-display-sm text-gray-900">Crear Cuenta</h1>
  <p className="text-gray-500 text-sm mt-1">Únete a la familia Tapete Teatro</p>
</div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="label-field">Correo electrónico</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="tu@correo.com" required />
                </div>
                <button type="submit" disabled={cargando} className="btn-primary w-full py-3.5">
                  {cargando ? <span className="spinner w-5 h-5" /> : 'Enviar enlace'}
                </button>
              </form>
              <div className="text-center mt-6">
                <Link to="/login" className="text-sm text-azul hover:text-azul-dark font-heading flex items-center gap-1 justify-center">
                  <ArrowLeft size={14} /> Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
