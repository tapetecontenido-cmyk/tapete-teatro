// src/pages/auth/Login.jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { iniciarSesion } = useAuth();
  const navigate          = useNavigate();
  const location          = useLocation();
  const from              = location.state?.from?.pathname || '/';

  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await iniciarSesion(form.email, form.password);
      toast.success('¡Bienvenido de vuelta!');
      navigate(from, { replace: true });
    } catch (err) {
      const mensajes = {
        'auth/user-not-found':     'No existe una cuenta con ese correo.',
        'auth/wrong-password':     'Contraseña incorrecta.',
        'auth/invalid-credential': 'Credenciales incorrectas.',
        'auth/too-many-requests':  'Demasiados intentos. Intenta más tarde.',
      };
      setError(mensajes[err.code] || 'Error al iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 pb-10 px-4">
      <div className="w-full max-w-md">
        <div className="card p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
  <img src="/logo-tapete-isotipo.png" alt="Tapete Teatro" className="h-16 w-auto mx-auto mb-4" />
  <h1 className="font-display text-display-sm text-gray-900">Iniciar Sesión</h1>
  <p className="text-gray-500 text-sm mt-1">Accede a tu cuenta de Tapete Teatro</p>
</div>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-field">Correo electrónico</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="tu@correo.com"
                className="input-field"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label-field">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Tu contraseña"
                  className="input-field pr-12"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/recuperar-password" className="text-sm text-azul hover:text-azul-dark font-heading">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button type="submit" disabled={cargando} className="btn-primary w-full py-3.5 text-base">
              {cargando ? <span className="spinner w-5 h-5" /> : 'Iniciar Sesión'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-azul hover:text-azul-dark font-heading font-bold">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
