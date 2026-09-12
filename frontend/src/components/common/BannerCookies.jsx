// src/components/common/BannerCookies.jsx
import { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';

export default function BannerCookies() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const respuesta = localStorage.getItem('tapete_cookies_consent');
    if (!respuesta) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const responder = (valor) => {
    localStorage.setItem('tapete_cookies_consent', valor);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 sm:p-6 animate-fade-up">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-azul/10 flex items-center justify-center flex-shrink-0">
            <Cookie size={20} className="text-azul" />
          </div>
          <div className="flex-1">
            <p className="font-heading font-bold text-gray-900 text-sm mb-1">Usamos cookies</p>
            <p className="text-gray-500 text-sm leading-relaxed">
              Usamos cookies esenciales para el funcionamiento del sitio (inicio de sesión y seguridad) y algunas
              opcionales para mejorar tu experiencia. Puedes conocer más en nuestra{' '}
              <a href="/politica-cookies" className="text-azul hover:underline font-heading font-bold">
                Política de Cookies
              </a>.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <button onClick={() => responder('accepted')}
                className="btn-primary text-sm py-2 px-5">
                Aceptar todas
              </button>
              <button onClick={() => responder('essential_only')}
                className="btn-outline text-sm py-2 px-5">
                Solo esenciales
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
