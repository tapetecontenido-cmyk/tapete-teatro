// src/pages/admin/AdminDashboard.jsx
// Panel de control principal — Tapete Teatro Admin
import { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  collection, query, where, orderBy, limit, getDocs, Timestamp,
} from 'firebase/firestore';
import {
  LayoutDashboard, Ticket, Calendar, BookOpen, Newspaper,
  Users, Settings, ChevronRight, TrendingUp,
  Menu, X, LogOut, Clock
} from 'lucide-react';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { clsx } from 'clsx';
import { format, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

// ── Sidebar links ──────────────────────────────────────────────────────
const ADMIN_LINKS = [
  { to: '/admin',               label: 'Dashboard',    icon: LayoutDashboard, exact: true },
  { to: '/admin/cartelera',     label: 'Cartelera',    icon: Ticket },
  { to: '/admin/talleres',      label: 'Talleres',     icon: BookOpen },
  { to: '/admin/noticias',      label: 'Noticias',     icon: Newspaper },
  { to: '/admin/usuarios',      label: 'Usuarios',     icon: Users },
  { to: '/admin/configuracion', label: 'Configuración',icon: Settings },
];

// ── Tarjeta de métrica ─────────────────────────────────────────────────
function MetricCard({ titulo, valor, subtitulo, icono: Icono, color, cargando }) {
  const colores = {
    azul:  'bg-azul text-white',
    cyan:  'bg-cyan text-white',
    verde: 'bg-green-500 text-white',
    amber: 'bg-amber-500 text-white',
  };
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('w-12 h-12 rounded-2xl flex items-center justify-center', colores[color])}>
          <Icono size={22} />
        </div>
        {subtitulo && <span className="text-xs text-gray-400 font-heading">{subtitulo}</span>}
      </div>
      {cargando ? (
        <div className="h-8 bg-gray-100 rounded animate-pulse w-20" />
      ) : (
        <p className="text-3xl text-gray-900" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>{valor}</p>
      )}
      <p className="text-sm text-gray-500 mt-1 font-heading">{titulo}</p>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────
function Sidebar({ open, onClose }) {
  const location = useLocation();
  const { cerrarSesion, perfil } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await cerrarSesion();
    navigate('/');
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={clsx(
        'fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-100 z-50 flex flex-col',
        'transition-transform duration-300', 'lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="font-display text-xl text-azul">Tapete Teatro</p>
            <p className="text-xs text-gray-400 font-heading uppercase tracking-wide mt-0.5">Panel de Control</p>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {perfil?.nombre?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-heading font-bold text-gray-900 truncate">{perfil?.nombre || 'Admin'}</p>
              <p className="text-xs text-gray-400 capitalize">{perfil?.role}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          {ADMIN_LINKS.map(({ to, label, icon: Icon, exact }) => {
            const isActive = exact ? location.pathname === to : location.pathname.startsWith(to) && to !== '/admin';
            const isActiveDash = exact && location.pathname === '/admin';
            return (
              <Link key={to} to={to} onClick={onClose}
                className={clsx('admin-nav-item', (isActive || isActiveDash) && 'admin-nav-item-active')}>
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <Link to="/" className="admin-nav-item text-gray-400 hover:text-gray-600 mb-1">
            <ChevronRight size={18} className="rotate-180" /> Ver sitio web
          </Link>
          <button onClick={handleLogout} className="admin-nav-item text-red-400 hover:bg-red-50 hover:text-red-600 w-full">
            <LogOut size={18} /> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}

// ── Dashboard principal ────────────────────────────────────────────────
function DashboardHome() {
  const [metricas, setMetricas] = useState({
    inscripcionesPendientes: 0,
    alumnosActivos:          0,
    talleresActivos:         0,
    obrasActivas:            0,
  });
  const [ultimasInscripciones, setUltimasInscripciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchMetricas = async () => {
      try {
        // Inscripciones pendientes de revisión
        const pendientesSnap = await getDocs(query(
          collection(db, 'inscripciones'),
          where('estado', '==', 'pendiente')
        ));

        // Alumnos con al menos una inscripción aprobada
        const aprobadasSnap = await getDocs(query(
          collection(db, 'inscripciones'),
          where('estado', '==', 'aprobada')
        ));
        const alumnosUnicos = new Set(aprobadasSnap.docs.map(d => d.data().userId));

        // Talleres activos
        const talleresSnap = await getDocs(query(
          collection(db, 'talleres'),
          where('activo', '==', true)
        ));

        // Obras activas
        const obrasSnap = await getDocs(query(
          collection(db, 'obras'),
          where('activo', '==', true)
        ));

        setMetricas({
          inscripcionesPendientes: pendientesSnap.size,
          alumnosActivos:          alumnosUnicos.size,
          talleresActivos:         talleresSnap.size,
          obrasActivas:            obrasSnap.size,
        });

        // Últimas 8 solicitudes de inscripción
        const ultimasSnap = await getDocs(query(
          collection(db, 'inscripciones'),
          orderBy('creadoEn', 'desc'),
          limit(8)
        ));
        setUltimasInscripciones(ultimasSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      } catch (err) {
        console.error('Error cargando métricas:', err.message);
      } finally {
        setCargando(false);
      }
    };
    fetchMetricas();
  }, []);

  const getEstadoBadge = (estado) => {
    const map = {
      pendiente: <span className="badge badge-pending">Pendiente</span>,
      aprobada:  <span className="badge badge-confirmed">Aprobada</span>,
      rechazada: <span className="badge badge-cancelled">Rechazada</span>,
    };
    return map[estado] || null;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-display-sm text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <MetricCard titulo="Inscripciones pendientes" valor={metricas.inscripcionesPendientes} subtitulo="por revisar" icono={Clock} color="amber" cargando={cargando} />
        <MetricCard titulo="Alumnos activos"          valor={metricas.alumnosActivos}          subtitulo="con acceso" icono={Users} color="cyan" cargando={cargando} />
        <MetricCard titulo="Talleres activos"         valor={metricas.talleresActivos}         subtitulo="disponibles" icono={BookOpen} color="azul" cargando={cargando} />
        <MetricCard titulo="Obras en cartelera"       valor={metricas.obrasActivas}            subtitulo="activas" icono={Ticket} color="verde" cargando={cargando} />
      </div>

      {/* Tabla de últimas inscripciones */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-heading font-bold text-gray-900">Últimas Solicitudes de Inscripción</h2>
          <Link to="/admin/talleres" className="text-sm text-azul hover:text-azul-dark font-heading font-bold flex items-center gap-1">
            Ir a talleres <ChevronRight size={14} />
          </Link>
        </div>

        {cargando ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : ultimasInscripciones.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-heading">No hay solicitudes de inscripción aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs font-heading font-bold text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-3 text-left">Alumno</th>
                  <th className="px-6 py-3 text-left hidden md:table-cell">Taller</th>
                  <th className="px-6 py-3 text-left hidden lg:table-cell">Contacto</th>
                  <th className="px-6 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ultimasInscripciones.map(i => (
                  <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <p className="text-sm font-heading font-bold text-gray-900">{i.alumno?.nombre}</p>
                      <p className="text-xs text-gray-400">{i.alumno?.email}</p>
                    </td>
                    <td className="px-6 py-3 hidden md:table-cell">
                      <p className="text-sm text-gray-600">{i.tallerNombre || '—'}</p>
                    </td>
                    <td className="px-6 py-3 hidden lg:table-cell">
                      <p className="text-xs text-gray-500">{i.alumno?.telefono || '—'}</p>
                    </td>
                    <td className="px-6 py-3 text-center">{getEstadoBadge(i.estado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Layout del admin ───────────────────────────────────────────────────
export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { esAdmin, esProfesor, cargando } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!cargando && !esAdmin && !esProfesor) {
      navigate('/');
    }
  }, [cargando, esAdmin, esProfesor]);

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="spinner w-10 h-10" />
    </div>
  );

  const isDashboard = location.pathname === '/admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Menu size={20} />
          </button>
          <div className="hidden lg:block">
            <p className="text-sm font-heading font-bold text-gray-900">
              {ADMIN_LINKS.find(l => l.to === location.pathname)?.label || 'Panel Admin'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-gray-400 hover:text-azul font-heading transition-colors">← Ver sitio</Link>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {isDashboard ? <DashboardHome /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}
