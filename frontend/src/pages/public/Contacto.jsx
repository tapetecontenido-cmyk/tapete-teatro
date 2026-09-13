// src/pages/public/Contacto.jsx
import { useState, useRef, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Phone, Instagram, Facebook, Send, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import { Turnstile } from '@marsidev/react-turnstile';

const ASUNTOS = ['Información general', 'Inscripción a talleres', 'Reserva de entradas', 'Prensa y colaboraciones', 'Otro'];
const CLAVE_ULTIMO_ENVIO = 'tapete_ultimo_contacto';
const ESPERA_MINUTOS = 2;

export default function Contacto() {
  const [form, setForm] = useState({ nombre: '', email: '', asunto: '', mensaje: '' });
  const [enviando, setEnviando] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const turnstileRef = useRef(null);

  // Verificar si hay un envío reciente al cargar la página
  useEffect(() => {
    const ultimo = localStorage.getItem(CLAVE_ULTIMO_ENVIO);
    if (ultimo) {
      const transcurrido = Date.now() - parseInt(ultimo, 10);
      const esperaMs = ESPERA_MINUTOS * 60 * 1000;
      if (transcurrido < esperaMs) {
        setSegundosRestantes(Math.ceil((esperaMs - transcurrido) / 1000));
      }
    }
  }, []);

  // Contador regresivo
  useEffect(() => {
    if (segundosRestantes <= 0) return;
    const timer = setInterval(() => {
      setSegundosRestantes(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [segundosRestantes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.email || !form.asunto || !form.mensaje) { toast.error('Completa todos los campos'); return; }
    if (!captchaToken) { toast.error('Completa la verificación de seguridad'); return; }
    if (segundosRestantes > 0) { toast.error('Espera un momento antes de enviar otro mensaje'); return; }

    setEnviando(true);
    try {
      await addDoc(collection(db, 'mensajes_contacto'), {
        nombre:   DOMPurify.sanitize(form.nombre.trim()),
        email:    form.email.trim(),
        asunto:   form.asunto,
        mensaje:  DOMPurify.sanitize(form.mensaje.trim()),
        creadoEn: serverTimestamp(),
      });

      localStorage.setItem(CLAVE_ULTIMO_ENVIO, String(Date.now()));
      setSegundosRestantes(ESPERA_MINUTOS * 60);

      toast.success('¡Mensaje enviado! Te responderemos pronto.');
      setForm({ nombre: '', email: '', asunto: '', mensaje: '' });
      setCaptchaToken('');
      turnstileRef.current?.reset();
    } catch {
      toast.error('Error al enviar');
    } finally {
      setEnviando(false);
    }
  };

  const formatearTiempo = (s) => {
    const min = Math.floor(s / 60);
    const seg = s % 60;
    return `${min}:${String(seg).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="bg-gradient-brand text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-white/70 text-sm font-heading uppercase tracking-widest mb-2">Estamos para ti</p>
          <h1 className="font-display text-display-md mb-3">Contacto</h1>
          <div className="w-16 h-1 bg-white/30 rounded-full" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Formulario */}
          <div className="card p-8">
            <h2 className="font-heading font-bold text-2xl text-gray-900 mb-6">Envíanos un mensaje</h2>

            {segundosRestantes > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-amber-700 text-sm">
                <Clock size={16} className="flex-shrink-0" />
                <span>Ya enviaste un mensaje. Podrás enviar otro en <strong>{formatearTiempo(segundosRestantes)}</strong>.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="label-field">Tu nombre</label>
                  <input type="text" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} className="input-field" placeholder="Juan Pérez" required />
                </div>
                <div>
                  <label className="label-field">Correo electrónico</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-field" placeholder="tu@correo.com" required />
                </div>
              </div>
              <div>
                <label className="label-field">Asunto</label>
                <select value={form.asunto} onChange={e => setForm(p => ({ ...p, asunto: e.target.value }))} className="input-field" required>
                  <option value="">Selecciona un asunto</option>
                  {ASUNTOS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="label-field">Mensaje</label>
                <textarea value={form.mensaje} onChange={e => setForm(p => ({ ...p, mensaje: e.target.value }))} className="input-field resize-none" rows={5} placeholder="Escribe tu mensaje aquí..." required maxLength={2000} />
              </div>

              <Turnstile
                ref={turnstileRef}
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                onSuccess={setCaptchaToken}
                onExpire={() => setCaptchaToken('')}
                onError={() => setCaptchaToken('')}
                options={{ theme: 'light', language: 'es' }}
              />

              <button type="submit" disabled={enviando || !captchaToken || segundosRestantes > 0} className="btn-primary w-full py-3.5 gap-2">
                {enviando ? <span className="spinner w-5 h-5" /> : <><Send size={18} /> Enviar mensaje</>}
              </button>
            </form>
          </div>

          {/* Info de contacto */}
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-heading font-bold text-gray-900 text-lg mb-4">Directores</h3>
              <div className="space-y-4">
                {[
                  { nombre: 'Antonio Cuevas', ig: '@antoniocuevass', tel: '+58 424-228-34-71', foto: '/antonio.jpg', ini: 'AC' },
                  { nombre: 'Daifra Blanco',  ig: '@daifrablanco',   tel: '+58 424-179-08-60', foto: '/daifra.jpg',  ini: 'DB' },
                ].map(({ nombre, ig, tel, foto, ini }) => (
                  <div key={nombre} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-azul/30 flex-shrink-0">
                      <img src={foto} alt={nombre} className="w-full h-full object-cover"
                        onError={e => {
                          e.target.style.display = 'none';
                          e.target.parentElement.style.background = 'linear-gradient(135deg,#3333CC,#299FE3)';
                          e.target.parentElement.style.display = 'flex';
                          e.target.parentElement.style.alignItems = 'center';
                          e.target.parentElement.style.justifyContent = 'center';
                          e.target.parentElement.innerHTML = `<span style="color:white;font-weight:bold;font-size:0.85rem">${ini}</span>`;
                        }} />
                    </div>
                    <div>
                      <p className="font-heading font-bold text-gray-900">{nombre}</p>
                      <div className="flex gap-3 text-sm text-gray-500">
                        <a href={`tel:${tel.replace(/\s/g, '')}`} className="hover:text-azul">{tel}</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-heading font-bold text-gray-900 text-lg mb-4">Redes Sociales</h3>
              <div className="space-y-3">
                <a href="https://instagram.com/tapeteteatro" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 hover:text-azul">
                  <Instagram size={20} className="text-pink-500" /> @tapeteteatro
                </a>
                <a href="https://facebook.com/tapeteteatro" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 hover:text-azul">
                  <Facebook size={20} className="text-blue-600" /> Tapete Tea (Facebook)
                </a>
              </div>
            </div>

            <div className="card overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d250452.18743614327!2d-67.07505695!3d10.48801255!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8c2a58adcd824807%3A0x5d679ceb50844f91!2sCaracas%2C%20Venezuela!5e0!3m2!1ses!2s!4v1700000000000"
                width="100%" height="250" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación Tapete Teatro"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
