// src/pages/admin/AdminDashboard.jsx
// Panel de control principal — Tapete Teatro Admin
import { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import {
  collection, query, where, orderBy, limit, getDocs,
  onSnapshot, Timestamp
} from 'firebase/firestore';
import {
  LayoutDashboard, Ticket, Calendar, BookOpen, Newspaper,
  Users, Settings, ChevronRight, TrendingUp, CheckCircle,
  Clock, XCircle, Menu, X, LogOut, Bell
} from 'lucide-react';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { clsx } from 'clsx';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

// ── Sidebar links ──────────────────────────────────────────────────────
const ADMIN_LINKS = [
  { to: '/admin',               label: 'Dashboard',    icon: LayoutDashboard, exact: true },
  { to: '/admin/cartelera',     label: 'Cartelera',    icon: Ticket },
  { to: '/admin/reservas',      label: 'Reservas',     icon: Calendar },
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
        <p className="font-display text-3xl text-gray-900">{valor}</p>
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
      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-100 z-50 flex flex-col',
        'transition-transform duration-300',
        'lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Header del sidebar */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="font-display text-xl text-azul">Tapete Teatro</p>
            <p className="text-xs text-gray-400 font-heading uppercase tracking-wide mt-0.5">Panel de Control</p>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Perfil del admin */}
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

        {/* Links de navegación */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          {ADMIN_LINKS.map(({ to, label, icon: Icon, exact }) => {
            const isActive = exact
              ? location.pathname === to
              : location.pathname.startsWith(to) && to !== '/admin';
            const isActiveDash = exact && location.pathname === '/admin';

            return (
              <Link
                key={to}
                to={to}
                onClick={onClose}
                className={clsx(
                  'admin-nav-item',
                  (isActive || isActiveDash) && 'admin-nav-item-active'
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Botón de logout */}
        <div className="p-4 border-t border-gray-100">
          <Link
            to="/"
            className="admin-nav-item text-gray-400 hover:text-gray-600 mb-1"
          >
            <ChevronRight size={18} className="rotate-180" />
            Ver sitio web
          </Link>
          <button
            onClick={handleLogout}
            className="admin-nav-item text-red-400 hover:bg-red-50 hover:text-red-600 w-full"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}

// ── Dashboard principal ────────────────────────────────────────────────
function DashboardHome() {
  const [metricas, setMetricas] = useState({
    reservasHoy:      0,
    ingresoesMes:     0,
    alumnosActivos:   0,
    funcionesSemana:  0,
  });
  const [ultimasReservas, setUltimasReservas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchMetricas = async () => {
      try {
        const hoy    = new Date();
        const inicio = startOfDay(hoy);
        const fin    = endOfDay(hoy);
        const mesIni = startOfMonth(hoy);
        const mesFin = endOfMonth(hoy);

        // Reservas de hoy
        const reservasHoySnap = await getDocs(query(
          collection(db, 'reservas'),
          where('creadoEn', '>=', Timestamp.fromDate(inicio)),
          where('creadoEn', '<=', Timestamp.fromDate(fin))
        ));
        const reservasHoy = reservasHoySnap.size;

        // Ingresos del mes (reservas confirmadas)
        const ingresosSnap = await getDocs(query(
          collection(db, 'reservas'),
          where('estado', '==', 'confirmada'),
          where('creadoEn', '>=', Timestamp.fromDate(mesIni)),
          where('creadoEn', '<=', Timestamp.fromDate(mesFin))
        ));
        const ingresosMes = ingresosSnap.docs.reduce((sum, d) => sum + (d.data().total || 0), 0);

        // Alumnos activos
        const alumnosSnap = await getDocs(query(
          collection(db, 'users'),
          where('role', '==', 'alumno'),
          where('activo', '==', true)
        ));

        setMetricas({
          reservasHoy,
          ingresosMes,
          alumnosActivos: alumnosSnap.size,
          funcionesSemana: 0, // Se puede calcular con otra query
        });

        // Últimas 8 reservas
        const ultimasSnap = await getDocs(query(
          collection(db, 'reservas'),
          orderBy('creadoEn', 'desc'),
          limit(8)
        ));
        setUltimasReservas(ultimasSnap.docs.map(d => ({ id: d.id, ...d.data() })));

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
      pendiente:  <span className="badge badge-pending">Pendiente</span>,
      confirmada: <span className="badge badge-confirmed">Confirmada</span>,
      cancelada:  <span className="badge badge-cancelled">Cancelada</span>,
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
        <MetricCard
          titulo="Reservas hoy"
          valor={metricas.reservasHoy}
          subtitulo="nuevas"
          icono={Calendar}
          color="azul"
          cargando={cargando}
        />
        <MetricCard
          titulo="Ingresos del mes"
          valor={`$${metricas.ingresosMes}`}
          subtitulo="USD"
          icono={TrendingUp}
          color="verde"
          cargando={cargando}
        />
        <MetricCard
          titulo="Alumnos activos"
          valor={metricas.alumnosActivos}
          subtitulo="registrados"
          icono={Users}
          color="cyan"
          cargando={cargando}
        />
        <MetricCard
          titulo="Funciones semana"
          valor={metricas.funcionesSemana}
          subtitulo="programadas"
          icono={Ticket}
          color="amber"
          cargando={cargando}
        />
      </div>

      {/* Tabla de últimas reservas */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-heading font-bold text-gray-900">Últimas Reservas</h2>
          <Link to="/admin/reservas" className="text-sm text-azul hover:text-azul-dark font-heading font-bold flex items-center gap-1">
            Ver todas <ChevronRight size={14} />
          </Link>
        </div>

        {cargando ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : ultimasReservas.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-heading">No hay reservas aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs font-heading font-bold text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-3 text-left">ID</th>
                  <th className="px-6 py-3 text-left">Cliente</th>
                  <th className="px-6 py-3 text-left hidden md:table-cell">Obra</th>
                  <th className="px-6 py-3 text-left hidden lg:table-cell">Asientos</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 text-center">Estado</th>
                  <th className="px-6 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ultimasReservas.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-xs font-mono text-gray-400">
                      #{r.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-6 py-3">
                      <p className="text-sm font-heading font-bold text-gray-900">{r.comprador?.nombre}</p>
                      <p className="text-xs text-gray-400">{r.comprador?.email}</p>
                    </td>
                    <td className="px-6 py-3 hidden md:table-cell">
                      <p className="text-sm text-gray-600">{r.obraNombre || '—'}</p>
                    </td>
                    <td className="px-6 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {r.asientos?.slice(0, 4).map(s => (
                          <span key={s} className="badge bg-gray-100 text-gray-600 text-xs">{s}</span>
                        ))}
                        {r.asientos?.length > 4 && (
                          <span className="badge bg-gray-100 text-gray-400">+{r.asientos.length - 4}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="font-heading font-bold text-gray-900">${r.total}</span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      {getEstadoBadge(r.estado)}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <Link
                        to={`/admin/reservas?id=${r.id}`}
                        className="text-xs text-azul hover:text-azul-dark font-heading font-bold"
                      >
                        Gestionar
                      </Link>
                    </td>
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

      {/* Contenido principal */}
      <div className="lg:ml-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="hidden lg:block">
            <p className="text-sm font-heading font-bold text-gray-900">
              {ADMIN_LINKS.find(l => l.to === location.pathname)?.label || 'Panel Admin'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-gray-400 hover:text-azul font-heading transition-colors">
              ← Ver sitio
            </Link>
          </div>
        </header>

        {/* Contenido */}
        <main className="p-4 sm:p-6 lg:p-8">
          {isDashboard ? <DashboardHome /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}
