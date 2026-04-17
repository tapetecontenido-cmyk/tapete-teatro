// src/pages/public/HomePage.jsx
// Página principal — Tapete Teatro
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { ArrowRight, Ticket, BookOpen, Star, Users, Calendar, Award, ChevronRight, Play } from 'lucide-react';
import { db } from '../../services/firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx } from 'clsx';

// ── Componente: Counter animado ────────────────────────────────────────
function AnimatedCounter({ end, suffix = '', duration = 1500 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = end / (duration / 16);
        const timer = setInterval(() => {
          start = Math.min(start + step, end);
          setCount(Math.floor(start));
          if (start >= end) clearInterval(timer);
        }, 16);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref} style={{ fontFamily: '"Bebas Neue", sans-serif' }}>{count}{suffix}</span>
}

// ── Componente: Badge de disponibilidad ───────────────────────────────
function BadgeDisponibilidad({ disponibles, total }) {
  if (disponibles === 0)           return <span className="badge badge-agotado">Agotado</span>;
  if (disponibles / total <= 0.2)  return <span className="badge badge-pocas">Pocas Entradas</span>;
  return <span className="badge badge-disponible">Disponible</span>;
}

// ── Componente: Tarjeta de obra ────────────────────────────────────────
function ObraCard({ obra }) {
  return (
    <Link to={`/cartelera/${obra.id}`}
      className="card group overflow-hidden flex flex-col">
      <div className="relative aspect-[2/3] overflow-hidden bg-gray-100">
        {obra.posterUrl ? (
          <img
            src={obra.posterUrl}
            alt={obra.nombre}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-brand flex items-center justify-center">
            <Ticket size={48} className="text-white/40" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <BadgeDisponibilidad
            disponibles={obra.asientosDisponibles || 100}
            total={obra.asientosTotal || 100}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300
                        flex items-end p-4">
          <span className="text-white font-heading font-bold text-sm flex items-center gap-1">
            Ver entradas <ArrowRight size={14} />
          </span>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <span className="text-xs font-heading font-bold text-cyan uppercase tracking-wider">{obra.genero}</span>
        <h3 className="font-display text-xl text-gray-900 mt-1 leading-tight">{obra.nombre}</h3>
        <p className="text-gray-500 text-sm mt-2 line-clamp-2 flex-1">{obra.descripcion}</p>
        {obra.proximaFuncion && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <Calendar size={12} />
            <span>
              {format(obra.proximaFuncion.toDate?.() || new Date(obra.proximaFuncion), "d MMM yyyy · HH:mm", { locale: es })}
            </span>
          </div>
        )}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400">Desde</span>
            <p className="font-heading font-bold text-azul">${obra.precioGeneral} USD</p>
          </div>
          <span className="btn-primary text-xs py-2 px-4">Comprar</span>
        </div>
      </div>
    </Link>
  );
}

// ── Componente: Tarjeta de taller ──────────────────────────────────────
function TallerCard({ taller }) {
  const colorNivel = {
    'Básico':        'bg-green-100 text-green-700',
    'Intermedio':    'bg-blue-100 text-blue-700',
    'Avanzado':      'bg-purple-100 text-purple-700',
    'Niños':         'bg-yellow-100 text-yellow-700',
    'Especial':      'bg-pink-100 text-pink-700',
    'Profesional':   'bg-red-100 text-red-700',
  };

  return (
    <Link to={`/talleres/${taller.id}`}
      className="card group p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center flex-shrink-0">
          <BookOpen size={22} className="text-white" />
        </div>
        <span className={clsx('badge text-xs', colorNivel[taller.nivel] || 'bg-gray-100 text-gray-600')}>
          {taller.nivel}
        </span>
      </div>
      <div className="flex-1">
        <h3 className="font-heading font-bold text-gray-900 text-lg leading-tight">{taller.nombre}</h3>
        <p className="text-gray-500 text-sm mt-2 line-clamp-2">{taller.descripcion}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-heading">Horario</p>
          <p className="text-gray-700 font-medium">{taller.horario}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-heading">Precio</p>
          <p className="font-heading font-bold text-azul">${taller.precio} USD</p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">Prof. {taller.profesorNombre}</span>
        <span className="text-azul hover:text-azul-dark font-heading font-bold text-sm
                         flex items-center gap-1 group-hover:gap-2 transition-all">
          Inscribirse <ChevronRight size={14} />
        </span>
      </div>
    </Link>
  );
}

// ── Componente: Tarjeta de noticia ─────────────────────────────────────
function NoticiaCard({ noticia }) {
  return (
    <Link to={`/noticias/${noticia.id}`}
      className="card group overflow-hidden flex flex-col sm:flex-row gap-0">
      <div className="sm:w-40 aspect-video sm:aspect-auto overflow-hidden bg-gray-100 flex-shrink-0">
        {noticia.imagenUrl ? (
          <img
            src={noticia.imagenUrl}
            alt={noticia.titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-subtle flex items-center justify-center">
            <Star size={24} className="text-azul/40" />
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col justify-center">
        <span className="text-xs font-heading font-bold text-cyan uppercase tracking-wider">{noticia.categoria}</span>
        <h3 className="font-heading font-bold text-gray-900 text-base mt-1 leading-snug
                       group-hover:text-azul transition-colors line-clamp-2">
          {noticia.titulo}
        </h3>
        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{noticia.resumen}</p>
        <p className="text-xs text-gray-400 mt-2">
          {noticia.fecha && format(noticia.fecha.toDate?.() || new Date(noticia.fecha), "d MMM yyyy", { locale: es })}
        </p>
      </div>
    </Link>
  );
}

// ── Página principal ───────────────────────────────────────────────────
export default function HomePage() {
  const [obras,    setObras]    = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [noticias, setNoticias] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obras destacadas
        const obrasSnap = await getDocs(
          query(collection(db, 'obras'),
            where('activo', '==', true),
            orderBy('creadoEn', 'desc'),
            limit(3))
        );
        setObras(obrasSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Talleres activos
        const talleresSnap = await getDocs(
          query(collection(db, 'talleres'),
            where('activo', '==', true),
            orderBy('creadoEn', 'desc'),
            limit(3))
        );
        setTalleres(talleresSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Últimas noticias
        const noticiasSnap = await getDocs(
          query(collection(db, 'noticias'),
            where('publicado', '==', true),
            orderBy('fecha', 'desc'),
            limit(3))
        );
        setNoticias(noticiasSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error cargando home:', err.message);
      } finally {
        setCargando(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen">

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-white">
        {/* Fondo con patrón */}
        <div className="absolute inset-0 hero-pattern" />

        {/* Elementos decorativos */}
        <div className="absolute top-1/4 right-10 w-64 h-64 rounded-full bg-cyan/10 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 left-10 w-80 h-80 rounded-full bg-azul/8 blur-3xl animate-float"
             style={{ animationDelay: '1s' }} />

        {/* Líneas decorativas */}
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-brand-v opacity-20" />
        <div className="absolute right-8 top-0 bottom-0 w-px bg-gradient-brand-v opacity-10" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Texto */}
            <div>
              {/* Badge de bienvenida */}
              <div className="inline-flex items-center gap-2 bg-azul/8 border border-azul/15 
                              rounded-full px-4 py-1.5 mb-8 animate-fade-up">
                <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
                <span className="text-sm font-heading font-bold text-azul">Temporada en curso</span>
              </div>

              <h1 className="font-display text-display-lg text-gray-900 leading-none mb-6
                             animate-fade-up animate-delay-100">
                El arte escénico
                <br />
                <span className="text-gradient">que te transforma</span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed mb-10 max-w-lg
                            animate-fade-up animate-delay-200">
                Escuela y compañía teatral venezolana formando actores y llevando
                el teatro a toda la comunidad desde hace más de una década.
              </p>

              <div className="flex flex-wrap gap-4 animate-fade-up animate-delay-300">
                <Link to="/cartelera" className="btn-primary text-base py-4 px-8 gap-3">
                  <Ticket size={20} />
                  Ver Cartelera
                </Link>
                <Link to="/talleres" className="btn-outline text-base py-4 px-8 gap-3">
                  <BookOpen size={20} />
                  Inscribirse a Talleres
                </Link>
              </div>

              {/* Directores */}
              <div className="mt-10 flex items-center gap-4 animate-fade-up animate-delay-400">
                <div className="flex -space-x-2">
                  {['AC', 'DB'].map((ini, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-brand
                                           border-2 border-white flex items-center justify-center
                                           text-white text-xs font-bold">
                      {ini}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-heading font-bold text-gray-900">Antonio Cuevas · Daifra Blanco</p>
                  <p className="text-xs text-gray-500">Directores fundadores</p>
                </div>
              </div>
            </div>

            {/* Visual derecha */}
            <div className="hidden lg:block relative animate-fade-up animate-delay-200">
              {/* Marco decorativo del teatro */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-brand rounded-3xl opacity-10 transform rotate-3" />
                <div className="relative bg-gradient-brand rounded-3xl p-1 shadow-brand-lg">
                  <div className="bg-white rounded-[1.4rem] overflow-hidden aspect-[4/5]
                                  flex items-center justify-center relative">
                    {/* Cortinas decorativas */}
                    <div className="absolute top-0 left-0 w-24 h-full bg-gradient-to-r from-azul/20 to-transparent" />
                    <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-cyan/20 to-transparent" />

                    {/* Símbolo central */}
                    <div className="text-center p-8 z-10">
                      <div className="w-32 h-32 rounded-full bg-gradient-brand mx-auto mb-6
                                      flex items-center justify-center shadow-brand-lg animate-float">
                        <svg viewBox="0 0 60 60" className="w-16 h-16">
                          {/* Icono de las máscaras */}
                          <circle cx="20" cy="25" r="14" fill="white" opacity="0.9"/>
                          <path d="M14 25 Q14 33 20 33 Q26 33 26 25Z" fill="#3333CC" opacity="0.5"/>
                          <circle cx="17" cy="22" r="2" fill="#3333CC"/>
                          <circle cx="23" cy="22" r="2" fill="#3333CC"/>
                          <circle cx="40" cy="28" r="14" fill="white" opacity="0.9"/>
                          <path d="M34 28 Q34 20 40 20 Q46 20 46 28Z" fill="#299FE3" opacity="0.5"/>
                          <circle cx="37" cy="24" r="2" fill="#299FE3"/>
                          <circle cx="43" cy="24" r="2" fill="#299FE3"/>
                        </svg>
                      </div>
                      <h2 className="font-display text-4xl text-azul">Tapete</h2>
                      <p className="font-heading text-xl text-cyan tracking-widest">Teatro</p>
                      <p className="text-gray-400 text-sm mt-3">Escuela · Compañía · Arte</p>
                    </div>
                  </div>
                </div>

                {/* Badges flotantes */}
                <div className="absolute -left-6 top-1/4 bg-white rounded-2xl shadow-card-lg px-4 py-3 border border-gray-100">
                  <p className="text-xs text-gray-400 font-heading uppercase tracking-wide">Próxima función</p>
                  <p className="font-heading font-bold text-gray-900 text-sm">¡Este fin de semana!</p>
                </div>

                <div className="absolute -right-6 bottom-1/4 bg-gradient-brand text-white rounded-2xl shadow-brand px-4 py-3">
                  <p className="text-xs opacity-80 font-heading uppercase tracking-wide">Talleres activos</p>
                  <p className="font-display text-2xl">Inscríbete</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2
                        text-gray-400 animate-bounce">
          <span className="text-xs font-heading tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-brand-v" />
        </div>
      </section>

      {/* ── ESTADÍSTICAS ────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-brand text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
             style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, white 0%, transparent 60%)' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { valor: 12,   sufijo: '+', label: 'Años de Trayectoria', icon: <Award size={28} /> },
              { valor: 500,  sufijo: '+', label: 'Alumnos Formados',    icon: <Users size={28} /> },
              { valor: 80,   sufijo: '+', label: 'Obras Presentadas',   icon: <Ticket size={28} /> },
              { valor: 15,   sufijo: '',  label: 'Talleres Activos',    icon: <BookOpen size={28} /> },
            ].map(({ valor, sufijo, label, icon }, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-1">
                  {icon}
                </div>
                <p className="font-display text-5xl font-bold">
                  <AnimatedCounter end={valor} suffix={sufijo} />
                </p>
                <p className="text-white/80 text-sm font-heading font-bold uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CARTELERA DESTACADA ──────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-sm font-heading font-bold text-cyan uppercase tracking-widest mb-2">
                En escena
              </p>
              <h2 className="font-display text-display-sm text-gray-900">Cartelera</h2>
              <div className="brand-divider mt-3" />
            </div>
            <Link to="/cartelera" className="btn-ghost gap-2 text-sm self-start sm:self-auto">
              Ver toda la cartelera <ArrowRight size={16} />
            </Link>
          </div>

          {cargando ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="rounded-2xl bg-gray-100 aspect-[2/3] animate-pulse" />
              ))}
            </div>
          ) : obras.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {obras.map(obra => <ObraCard key={obra.id} obra={obra} />)}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Ticket size={48} className="mx-auto mb-4 opacity-40" />
              <p className="font-heading">Próximamente nuevas obras en cartelera</p>
            </div>
          )}
        </div>
      </section>

      {/* ── QUIÉNES SOMOS (resumen) ──────────────────────────────────── */}
      <section className="py-24 section-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-heading font-bold text-cyan uppercase tracking-widest mb-2">
                Nuestra historia
              </p>
              <h2 className="font-display text-display-sm text-gray-900 mb-6">
                Más de una década<br />haciendo teatro
              </h2>
              <div className="brand-divider mb-8" />
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Tapete Teatro nació del sueño compartido de Antonio Cuevas y Daifra Blanco de llevar el
                arte escénico a cada rincón de Venezuela. Hoy somos una escuela y compañía reconocida
                por la formación integral de actores y la producción de teatro de calidad.
              </p>
              <p className="text-gray-500 leading-relaxed mb-8">
                Nuestra metodología combina las técnicas teatrales más reconocidas con la vibrant cultura
                venezolana, creando un espacio donde la creatividad, la disciplina y la pasión se unen.
              </p>
              <Link to="/quienes-somos" className="btn-primary gap-2">
                Conocer más <ArrowRight size={18} />
              </Link>
            </div>

            {/* Valores */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { titulo: 'Excelencia', desc: 'Formación teatral de alta calidad con metodologías probadas.', color: 'bg-azul' },
                { titulo: 'Comunidad',  desc: 'Un espacio de apoyo y crecimiento mutuo entre artistas.', color: 'bg-cyan' },
                { titulo: 'Creatividad', desc: 'Exploramos nuevas formas de expresión artística.', color: 'bg-cyan' },
                { titulo: 'Pasión',     desc: 'El amor al teatro nos mueve y nos une cada día.', color: 'bg-azul' },
              ].map(({ titulo, desc, color }, i) => (
                <div key={i}
                     className="card-brand p-6 hover:shadow-brand-lg transition-all duration-300
                                hover:-translate-y-1">
                  <div className={clsx('w-10 h-10 rounded-xl mb-4 flex items-center justify-center', color)}>
                    <Star size={18} className="text-white" />
                  </div>
                  <h3 className="font-heading font-bold text-gray-900 mb-1">{titulo}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TALLERES ────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-sm font-heading font-bold text-cyan uppercase tracking-widest mb-2">
                Formación
              </p>
              <h2 className="font-display text-display-sm text-gray-900">Talleres y Cursos</h2>
              <div className="brand-divider mt-3" />
            </div>
            <Link to="/talleres" className="btn-ghost gap-2 text-sm self-start sm:self-auto">
              Ver todos los talleres <ArrowRight size={16} />
            </Link>
          </div>

          {cargando ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="rounded-2xl bg-gray-100 h-64 animate-pulse" />
              ))}
            </div>
          ) : talleres.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {talleres.map(t => <TallerCard key={t.id} taller={t} />)}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <BookOpen size={48} className="mx-auto mb-4 opacity-40" />
              <p className="font-heading">Próximamente nuevos talleres disponibles</p>
            </div>
          )}
        </div>
      </section>

      {/* ── NOTICIAS ────────────────────────────────────────────────── */}
      <section className="py-24 section-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-sm font-heading font-bold text-cyan uppercase tracking-widest mb-2">
                Actualidad
              </p>
              <h2 className="font-display text-display-sm text-gray-900">Últimas Noticias</h2>
              <div className="brand-divider mt-3" />
            </div>
            <Link to="/noticias" className="btn-ghost gap-2 text-sm self-start sm:self-auto">
              Ver todas las noticias <ArrowRight size={16} />
            </Link>
          </div>

          {cargando ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="rounded-2xl bg-gray-100 h-28 animate-pulse" />
              ))}
            </div>
          ) : noticias.length > 0 ? (
            <div className="space-y-4">
              {noticias.map(n => <NoticiaCard key={n.id} noticia={n} />)}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Star size={48} className="mx-auto mb-4 opacity-40" />
              <p className="font-heading">Próximamente novedades de Tapete Teatro</p>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-brand relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
             style={{ backgroundImage: 'radial-gradient(circle at 75% 50%, white 0%, transparent 60%)' }} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white relative">
          <h2 className="font-display text-display-md mb-6">
            ¿Listo para el escenario?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Únete a la familia Tapete Teatro y descubre todo lo que el teatro puede hacer por ti.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/registro"
              className="bg-white text-azul font-heading font-bold px-8 py-4 rounded-xl
                         hover:bg-white/90 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg
                         flex items-center gap-2">
              <Users size={20} />
              Crear cuenta gratis
            </Link>
            <Link to="/contacto"
              className="border-2 border-white/40 text-white font-heading font-bold px-8 py-4 rounded-xl
                         hover:border-white hover:bg-white/10 transition-all duration-300
                         flex items-center gap-2">
              Contáctanos
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
