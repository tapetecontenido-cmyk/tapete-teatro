// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Phone, Mail, MapPin, ExternalLink } from 'lucide-react';

const FooterLogo = () => (
  <img src="/logo-tapete-blanco.png" alt="Tapete Teatro"/>
);

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      {/* Franja de color */}
      <div className="h-1 bg-gradient-brand" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Columna 1 — Identidad */}
          <div className="lg:col-span-1">
            <FooterLogo />
            <p className="mt-4 text-gray-400 text-sm leading-relaxed">
              Escuela y compañía teatral venezolana dedicada a formar actores
              y llevar el arte escénico a toda la comunidad.
            </p>
            {/* Redes sociales */}
            <div className="mt-5 flex gap-3">
              <a
                href="https://instagram.com/tapeteteatro"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-cyan transition-colors flex items-center justify-center"
                aria-label="Instagram Tapete Teatro"
              >
                <Instagram size={16} />
              </a>
              <a
                href="https://facebook.com/tapeteteatro"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-cyan transition-colors flex items-center justify-center"
                aria-label="Facebook Tapete Teatro"
              >
                <Facebook size={16} />
              </a>
              <a
                href="https://instagram.com/antoniocuevass"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-cyan transition-colors flex items-center justify-center text-xs font-bold"
                aria-label="Instagram Antonio Cuevas"
              >
                AC
              </a>
              <a
                href="https://instagram.com/daifrablanco"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-cyan transition-colors flex items-center justify-center text-xs font-bold"
                aria-label="Instagram Daifra Blanco"
              >
                DB
              </a>
            </div>
          </div>

          {/* Columna 2 — Navegación */}
          <div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-widest text-cyan mb-5">Navegación</h3>
            <ul className="space-y-3">
              {[
                { to: '/',              label: 'Inicio' },
                { to: '/quienes-somos', label: 'Quiénes Somos' },
                { to: '/cartelera',     label: 'Cartelera' },
                { to: '/talleres',      label: 'Talleres y Cursos' },
                { to: '/noticias',      label: 'Noticias' },
                { to: '/contacto',      label: 'Contacto' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-gray-400 hover:text-white text-sm transition-colors hover:translate-x-1 inline-block"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3 — Servicios */}
          <div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-widest text-cyan mb-5">Servicios</h3>
            <ul className="space-y-3">
              {[
                { to: '/talleres',  label: 'Talleres de Actuación' },
                { to: '/talleres',  label: 'Cursos para Niños' },
                { to: '/talleres',  label: 'Talleres Profesionales' },
                { to: '/cartelera', label: 'Comprar Entradas' },
                { to: '/registro',  label: 'Crear Cuenta' },
                { to: '/login',     label: 'Iniciar Sesión' },
              ].map(({ to, label }, i) => (
                <li key={i}>
                  <Link
                    to={to}
                    className="text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 4 — Contacto */}
          <div>
            <h3 className="font-heading font-bold text-sm uppercase tracking-widest text-cyan mb-5">Contacto</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone size={16} className="text-cyan mt-0.5 flex-shrink-0" />
                <div>
                  <a href="tel:+584242283471"
                    className="text-gray-400 hover:text-white text-sm transition-colors block">
                    +58 424-228-34-71
                  </a>
                  <a href="tel:+584241790860"
                    className="text-gray-400 hover:text-white text-sm transition-colors block">
                    +58 424-179-08-60
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Instagram size={16} className="text-cyan mt-0.5 flex-shrink-0" />
                <div>
                  <a href="https://instagram.com/tapeteteatro" target="_blank" rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white text-sm transition-colors block">
                    @tapeteteatro
                  </a>
                  <a href="https://instagram.com/antoniocuevass" target="_blank" rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white text-sm transition-colors block">
                    @antoniocuevass
                  </a>
                  <a href="https://instagram.com/daifrablanco" target="_blank" rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white text-sm transition-colors block">
                    @daifrablanco
                  </a>
                </div>
              </li>
              <li>
                <Link to="/contacto"
                  className="inline-flex items-center gap-2 btn-outline border-white/20 text-white hover:bg-white/10 text-sm py-2.5 px-4">
                  Enviar mensaje <ExternalLink size={14} />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Línea inferior */}
        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © {year} Tapete Teatro. Todos los derechos reservados.
          </p>
          <p className="text-gray-600 text-xs">
            Diseño por{' '}
            <a href="https://www.instagram.com/deblancox/" target="_blank" rel="noopener noreferrer"
              className="text-gray-500 hover:text-cyan transition-colors">
              Derian Blanco
            </a>
            {' · '}
            Desarrollo digital
          </p>
        </div>
      </div>
    </footer>
  );
}
