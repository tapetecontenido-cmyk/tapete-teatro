// src/pages/auth/Registro.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import DOMPurify from 'dompurify';
import { formatearCedula, formatearTelefono, limpiarCedula, limpiarTelefono } from '../../utils/formatear';
import toast from 'react-hot-toast';

export default function Registro() {
  const { registrar } = useAuth();
  const navigate      = useNavigate();

  const [form, setForm] = useState({
    nombre: '', cedula: '', telefono: '', email: '', password: '', confirm: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errores,  setErrores]  = useState({});

  const validar = () => {
    const e = {};
    if (!form.nombre.trim())    e.nombre   = 'El nombre es requerido';
    if (!form.cedula.trim())    e.cedula   = 'La cédula es requerida';
    if (!form.telefono.trim())  e.telefono = 'El teléfono es requerido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido';
    if (form.password.length < 8) e.password = 'Mínimo 8 caracteres';
    if (form.password !== form.confirm) e.confirm = 'Las contraseñas no coinciden';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validar()) return;
    setCargando(true);
    try {
      await registrar({
        nombre:   DOMPurify.sanitize(form.nombre.trim()),
        cedula:   limpiarCedula(form.cedula),
        telefono: limpiarTelefono(form.telefono),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });
      toast.success('¡Cuenta creada exitosamente!');
      navigate('/');
    } catch (err) {
      const mensajes = {
        'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
        'auth/weak-password':        'La contraseña es muy débil.',
      };
      toast.error(mensajes[err.code] || 'Error al crear la cuenta.');
    } finally {
      setCargando(false);
    }
  };

  const fortaleza = () => {
    const p = form.password;
    if (!p) return null;
    let pts = 0;
    if (p.length >= 8)  pts++;
    if (/[A-Z]/.test(p)) pts++;
    if (/[0-9]/.test(p)) pts++;
    if (/[^A-Za-z0-9]/.test(p)) pts++;
    if (pts <= 1) return { label: 'Débil',   color: 'bg-red-400',   w: 'w-1/4' };
    if (pts === 2) return { label: 'Regular', color: 'bg-yellow-400', w: 'w-1/2' };
    if (pts === 3) return { label: 'Buena',   color: 'bg-blue-400',  w: 'w-3/4' };
    return { label: 'Excelente', color: 'bg-green-500', w: 'w-full' };
  };

  const fort = fortaleza();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 pb-10 px-4">
      <div className="w-full max-w-lg">
        <div className="card p-8 sm:p-10">
          <div className="text-center mb-8">
  <img src="/logo-tapete-isotipo.png" alt="Tapete Teatro" className="h-16 w-auto mx-auto mb-4" />
  <h1 className="font-display text-display-sm text-gray-900">Recuperar contraseña</h1>
  <p className="text-gray-500 text-sm mt-1">Te enviaremos un enlace por correo</p>
</div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              {[
                { key: 'nombre',   label: 'Nombre completo',    type: 'text',  placeholder: 'Juan Pérez',          col: 'sm:col-span-2' },
                { key: 'cedula',   label: 'Cédula / Pasaporte', type: 'text',  placeholder: '24.172.120' },
{ key: 'telefono', label: 'Teléfono',           type: 'tel',   placeholder: '0424-368-59-86' },
                { key: 'email',    label: 'Correo electrónico', type: 'email', placeholder: 'tu@correo.com',        col: 'sm:col-span-2' },
              ].map(({ key, label, type, placeholder, col }) => (
                <div key={key} className={col}>
                  <label className="label-field">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={e => {
  let val = e.target.value;
  if (key === 'cedula')   val = formatearCedula(val);
  if (key === 'telefono') val = formatearTelefono(val);
  setForm(p => ({ ...p, [key]: val }));
}}
                    placeholder={placeholder}
                    className={`input-field ${errores[key] ? 'border-red-400' : ''}`}
                  />
                  {errores[key] && <p className="text-red-500 text-xs mt-1">{errores[key]}</p>}
                </div>
              ))}
            </div>

            <div className="space-y-5">
              <div>
                <label className="label-field">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Mínimo 8 caracteres"
                    className={`input-field pr-12 ${errores.password ? 'border-red-400' : ''}`}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fort && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${fort.color} ${fort.w}`} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Contraseña: {fort.label}</p>
                  </div>
                )}
                {errores.password && <p className="text-red-500 text-xs mt-1">{errores.password}</p>}
              </div>

              <div>
                <label className="label-field">Confirmar contraseña</label>
                <input
                  type="password"
                  value={form.confirm}
                  onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                  placeholder="Repite tu contraseña"
                  className={`input-field ${errores.confirm ? 'border-red-400' : ''}`}
                />
                {errores.confirm && <p className="text-red-500 text-xs mt-1">{errores.confirm}</p>}
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-5 mb-6">
              Al registrarte aceptas nuestros{' '}
              <a href="#" className="text-azul hover:underline">Términos de Uso</a>
              {' '}y{' '}
              <a href="#" className="text-azul hover:underline">Política de Privacidad</a>.
            </p>

            <button type="submit" disabled={cargando} className="btn-primary w-full py-3.5 text-base">
              {cargando ? <span className="spinner w-5 h-5" /> : 'Crear mi cuenta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-azul hover:text-azul-dark font-heading font-bold">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
