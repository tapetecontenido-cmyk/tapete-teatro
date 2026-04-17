// src/components/layout/Navbar.jsx
// Barra de navegación principal — Tapete Teatro
import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Menu, X, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { clsx } from 'clsx';

// Logotipo Tapete Teatro
const LogoTapete = () => (
  <img src="/logo-tapete.png" alt="Tapete Teatro" className="h-10 w-auto" />
);

const NAV_LINKS = [
  { to: '/',          label: 'Inicio' },
  { to: '/quienes-somos', label: 'Quiénes Somos' },
  { to: '/cartelera', label: 'Cartelera' },
  { to: '/talleres',  label: 'Talleres' },
  { to: '/noticias',  label: 'Noticias' },
  { to: '/contacto',  label: 'Contacto' },
];

export default function Navbar() {
  const { user, perfil, cerrarSesion, esAdmin, esProfesor } = useAuth();
  const navigate   = useNavigate();
  const [menuOpen,  setMenuOpen]   = useState(false);
  const [userMenu,  setUserMenu]   = useState(false);
  const [notifOpen, setNotifOpen]  = useState(false);
  const [notifs,    setNotifs]     = useState([]);
  const [scrolled,  setScrolled]   = useState(false);
  const userRef  = useRef(null);
  const notifRef = useRef(null);

  // ── Detectar scroll ────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Cerrar dropdowns al click fuera ───────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (userRef.current  && !userRef.current.contains(e.target))  setUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Suscribirse a notificaciones ───────────────────────────────────────
  useEffect(() => {
    if (!user) { setNotifs([]); return; }
    const q = query(
      collection(db, 'notificaciones'),
      where('userId', '==', user.uid),
      orderBy('creadaEn', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  const notLeidas = notifs.filter(n => !n.leida).length;

  const marcarLeida = async (id) => {
    await updateDoc(doc(db, 'notificaciones', id), { leida: true });
  };

  const handleLogout = async () => {
    await cerrarSesion();
    setUserMenu(false);
    navigate('/');
  };

  return (
    <nav className={clsx(
      'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
      scrolled
        ? 'bg-white/95 backdrop-blur-md shadow-card border-b border-gray-100'
        : 'bg-white/80 backdrop-blur-sm'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 hover:opacity-90 transition-opacity">
            <LogoTapete className="h-10 w-auto" />
          </Link>

          {/* Links desktop */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => clsx(
                  'nav-link px-3 py-2 rounded-lg text-sm',
                  isActive && 'nav-link-active text-azul'
                )}
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* Acciones derecha */}
          <div className="flex items-center gap-2">

            {user ? (
              <>
                {/* Campana de notificaciones */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="relative p-2 rounded-xl text-gray-600 hover:text-azul hover:bg-azul/10 transition-colors"
                    aria-label="Notificaciones"
                  >
                    <Bell size={20} />
                    {notLeidas > 0 && (
                      <span className="notif-badge">{notLeidas > 9 ? '9+' : notLeidas}</span>
                    )}
                  </button>

                  {/* Dropdown de notificaciones */}
                  {notifOpen && (
                    <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-card-lg border border-gray-100 z-50 overflow-hidden">
                      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <span className="font-heading font-bold text-gray-900 text-sm">Notificaciones</span>
                        {notLeidas > 0 && (
                          <span className="badge badge-pending">{notLeidas} nuevas</span>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                        {notifs.length === 0 ? (
                          <p className="p-6 text-center text-gray-400 text-sm">Sin notificaciones</p>
                        ) : (
                          notifs.slice(0, 10).map(n => (
                            <button
                              key={n.id}
                              onClick={() => marcarLeida(n.id)}
                              className={clsx(
                                'w-full text-left p-4 hover:bg-gray-50 transition-colors',
                                !n.leida && 'bg-azul/3'
                              )}
                            >
                              <div className="flex gap-3">
                                {!n.leida && (
                                  <span className="w-2 h-2 rounded-full bg-azul mt-1.5 flex-shrink-0" />
                                )}
                                <div className={!n.leida ? '' : 'ml-5'}>
                                  <p className="text-sm font-heading font-bold text-gray-800">{n.titulo}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{n.mensaje}</p>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Menú de usuario */}
                <div className="relative" ref={userRef}>
                  <button
                    onClick={() => setUserMenu(!userMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    {perfil?.fotoPerfil ? (
                      <img
                        src={perfil.fotoPerfil}
                        alt={perfil.nombre}
                        className="w-8 h-8 rounded-full object-cover border-2 border-azul/20"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold">
                        {perfil?.nombre?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="hidden sm:block text-sm font-heading font-bold text-gray-700 max-w-24 truncate">
                      {perfil?.nombre?.split(' ')[0] || 'Usuario'}
                    </span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>

                  {userMenu && (
                    <div className="absolute right-0 top-12 w-52 bg-white rounded-2xl shadow-card-lg border border-gray-100 z-50 py-2">
                      <div className="px-4 py-2 border-b border-gray-100 mb-1">
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-heading">{perfil?.role || 'alumno'}</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{perfil?.nombre}</p>
                      </div>
                      <Link to="/perfil" onClick={() => setUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-azul transition-colors">
                        <User size={16} /> Mi Perfil
                      </Link>
                      {(esAdmin || esProfesor) && (
                        <Link to="/admin" onClick={() => setUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-azul transition-colors">
                          <Settings size={16} /> Panel Admin
                        </Link>
                      )}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left">
                          <LogOut size={16} /> Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm py-2">
                  Iniciar Sesión
                </Link>
                <Link to="/registro" className="btn-primary text-sm py-2.5">
                  Registrarse
                </Link>
              </>
            )}

            {/* Hamburguesa móvil */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-azul hover:bg-azul/10 transition-colors"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {menuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md">
          <div className="px-4 py-4 space-y-1">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => clsx(
                  'block px-4 py-3 rounded-xl font-heading font-bold text-sm transition-colors',
                  isActive
                    ? 'bg-azul text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-azul'
                )}
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
