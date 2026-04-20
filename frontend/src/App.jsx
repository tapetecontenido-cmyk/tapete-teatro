// src/App.jsx
// Enrutamiento principal — Tapete Teatro
import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import WhatsAppFloat from './components/common/WhatsAppFloat';

// ── Páginas públicas (lazy loading) ───────────────────────────────────
const HomePage      = lazy(() => import('./pages/public/HomePage'));
const QuienesSomos  = lazy(() => import('./pages/public/QuienesSomos'));
const Cartelera     = lazy(() => import('./pages/public/Cartelera'));
const ObraDetalle   = lazy(() => import('./pages/public/ObraDetalle'));
const BookingFlow   = lazy(() => import('./pages/public/BookingFlow'));
const Talleres      = lazy(() => import('./pages/public/Talleres'));
const TallerDetalle = lazy(() => import('./pages/public/TallerDetalle'));
const Noticias      = lazy(() => import('./pages/public/Noticias'));
const NoticiaDetalle= lazy(() => import('./pages/public/NoticiaDetalle'));
const Contacto      = lazy(() => import('./pages/public/Contacto'));

// ── Auth pages ─────────────────────────────────────────────────────────
const Login         = lazy(() => import('./pages/auth/Login'));
const Registro      = lazy(() => import('./pages/auth/Registro'));
const RecuperarPass = lazy(() => import('./pages/auth/RecuperarPass'));
const PerfilAlumno  = lazy(() => import('./pages/auth/PerfilAlumno'));

// ── Admin pages ────────────────────────────────────────────────────────
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminCartelera    = lazy(() => import('./pages/admin/AdminCartelera'));
const AdminReservas     = lazy(() => import('./pages/admin/AdminReservas'));
const AdminTalleres     = lazy(() => import('./pages/admin/AdminTalleres'));
const AdminNoticias     = lazy(() => import('./pages/admin/AdminNoticias'));
const AdminUsuarios     = lazy(() => import('./pages/admin/AdminUsuarios'));
const AdminConfiguracion= lazy(() => import('./pages/admin/AdminConfiguracion'));
const CroquisEditorPage = lazy(() => import('./pages/admin/CroquisEditorPage'));

// ── Spinner de carga ───────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="spinner w-12 h-12" />
        <p className="text-gray-400 font-heading text-sm">Cargando...</p>
      </div>
    </div>
  );
}

// ── Ruta protegida genérica ────────────────────────────────────────────
function ProtectedRoute({ children, requiredRole }) {
  const { user, perfil, cargando } = useAuth();

  if (cargando) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(perfil?.role)) return <Navigate to="/" replace />;
  }

  return children;
}

// ── Layout público (con Navbar y Footer) ──────────────────────────────
function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}

// ── App Principal ──────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* ── Rutas públicas ─────────────────────────────────────── */}
        <Route path="/" element={
          <PublicLayout><HomePage /></PublicLayout>
        } />

        <Route path="/quienes-somos" element={
          <PublicLayout><QuienesSomos /></PublicLayout>
        } />

        <Route path="/cartelera" element={
          <PublicLayout><Cartelera /></PublicLayout>
        } />

        <Route path="/cartelera/:obraId" element={
          <PublicLayout><ObraDetalle /></PublicLayout>
        } />

        <Route path="/cartelera/:obraId/reservar/:funcionId" element={
          <PublicLayout><BookingFlow /></PublicLayout>
        } />

        <Route path="/talleres" element={
          <PublicLayout><Talleres /></PublicLayout>
        } />

        <Route path="/talleres/:tallerId" element={
          <PublicLayout><TallerDetalle /></PublicLayout>
        } />

        <Route path="/noticias" element={
          <PublicLayout><Noticias /></PublicLayout>
        } />

        <Route path="/noticias/:noticiaId" element={
          <PublicLayout><NoticiaDetalle /></PublicLayout>
        } />

        <Route path="/contacto" element={
          <PublicLayout><Contacto /></PublicLayout>
        } />

        {/* ── Auth ───────────────────────────────────────────────── */}
        <Route path="/login" element={
          <PublicLayout><Login /></PublicLayout>
        } />

        <Route path="/registro" element={
          <PublicLayout><Registro /></PublicLayout>
        } />

        <Route path="/recuperar-password" element={
          <PublicLayout><RecuperarPass /></PublicLayout>
        } />

        <Route path="/perfil" element={
          <ProtectedRoute>
            <PublicLayout><PerfilAlumno /></PublicLayout>
          </ProtectedRoute>
        } />

        {/* ── Admin (solo admin y profesor) ──────────────────────── */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole={['admin', 'profesor']}>
            <AdminDashboard />
          </ProtectedRoute>
        }>
          <Route path="cartelera"     element={<AdminCartelera />} />
          <Route path="reservas"      element={<AdminReservas />} />
          <Route path="talleres"      element={<AdminTalleres />} />
          <Route path="noticias"      element={<AdminNoticias />} />
          <Route path="usuarios"      element={
            <ProtectedRoute requiredRole="admin">
              <AdminUsuarios />
            </ProtectedRoute>
          } />
          <Route path="configuracion" element={
            <ProtectedRoute requiredRole="admin">
              <AdminConfiguracion />
            </ProtectedRoute>
          } />
        </Route>

        {/* ── Editor de croquis (página completa independiente) ── */}
        <Route path="/admin/croquis/:obraId" element={
          <ProtectedRoute requiredRole="admin">
            <CroquisEditorPage />
          </ProtectedRoute>
        } />

        {/* ── 404 ────────────────────────────────────────────────── */}
        <Route path="*" element={
          <PublicLayout>
            <div className="min-h-screen flex items-center justify-center pt-20">
              <div className="text-center">
                <p className="font-display text-8xl text-azul/20 mb-4">404</p>
                <h1 className="font-display text-3xl text-gray-900 mb-2">Página no encontrada</h1>
                <p className="text-gray-500 mb-6">Esta página no existe o fue movida.</p>
                <a href="/" className="btn-primary">Volver al inicio</a>
              </div>
            </div>
          </PublicLayout>
        } />

      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              fontWeight: '600',
              borderRadius: '12px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            },
            success: {
              iconTheme: { primary: '#3333CC', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#fff' },
            },
          }}
        />
      </AuthProvider>
    </Router>
  );
}
