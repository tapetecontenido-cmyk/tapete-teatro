// src/pages/public/QuienesSomos.jsx
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Star, Award, Users, Heart, Lightbulb } from 'lucide-react';

const HITOS = [
  { año: '2012', titulo: 'Fundación',       desc: 'Antonio Cuevas y Daifra Blanco fundan Tapete Teatro con el sueño de llevar el teatro a Venezuela.' },
  { año: '2014', titulo: 'Primera obra',    desc: 'Estreno de la primera producción profesional con gran acogida del público caraqueño.' },
  { año: '2016', titulo: 'Escuela teatral', desc: 'Apertura de la primera edición de talleres formativos para actores de todos los niveles.' },
  { año: '2018', titulo: 'Reconocimientos', desc: 'Premio a la Mejor Dirección y Mejor Elenco en los Premios de Teatro Nacional.' },
  { año: '2020', titulo: 'Teatro digital',  desc: 'Adaptación a formatos digitales durante la pandemia, alcanzando audiencias en toda América Latina.' },
  { año: '2024', titulo: 'Hoy',             desc: 'Más de 500 actores formados, 80+ obras y una comunidad vibrante de artistas escénicos.' },
];

export default function QuienesSomos() {
  const [profesores, setProfesores] = useState([]);

  useEffect(() => {
    getDocs(query(collection(db, 'users'), where('role', '==', 'profesor'), where('activo', '==', true)))
      .then(snap => setProfesores(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Hero */}
      <div className="bg-gradient-brand text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-white/70 text-sm font-heading uppercase tracking-widest mb-2">Nuestra historia</p>
          <h1 className="font-display text-display-md mb-3">Quiénes Somos</h1>
          <div className="w-16 h-1 bg-white/30 rounded-full" />
        </div>
      </div>

      {/* Historia */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-heading font-bold text-cyan uppercase tracking-widest mb-3">Nuestra misión</p>
            <h2 className="font-display text-display-sm text-gray-900 mb-6">Arte que transforma vidas</h2>
            <div className="brand-divider mb-6" />
            <p className="text-gray-600 text-lg leading-relaxed mb-4">
              Tapete Teatro es una escuela y compañía teatral venezolana fundada en 2012 por los directores 
              <strong className="text-azul"> Antonio Cuevas</strong> y <strong className="text-azul">Daifra Blanco</strong>. 
              Nacimos del sueño compartido de llevar el arte escénico a todos los rincones de Venezuela.
            </p>
            <p className="text-gray-500 leading-relaxed">
              A lo largo de más de una década, hemos formado a más de 500 actores, producido más de 80 obras 
              y construido una comunidad vibrante de artistas que creen en el poder transformador del teatro.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Award,    titulo: 'Excelencia',  desc: 'Formación teatral de la más alta calidad.' },
              { icon: Users,    titulo: 'Comunidad',   desc: 'Un espacio de apoyo y crecimiento mutuo.' },
              { icon: Heart,    titulo: 'Pasión',      desc: 'El amor al teatro nos mueve cada día.' },
              { icon: Lightbulb,titulo: 'Creatividad', desc: 'Nuevas formas de expresión artística.' },
            ].map(({ icon: Icon, titulo, desc }) => (
              <div key={titulo} className="card-brand p-5 hover:-translate-y-1 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center mb-3">
                  <Icon size={18} className="text-white" />
                </div>
                <h3 className="font-heading font-bold text-gray-900">{titulo}</h3>
                <p className="text-gray-500 text-sm mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Misión, Visión, Valores */}
      <section className="py-16 section-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { titulo: 'Misión', texto: 'Formar actores integrales y producir teatro de alta calidad que conecte con las audiencias venezolanas, llevando el arte escénico a toda la comunidad.', color: 'bg-azul' },
              { titulo: 'Visión', texto: 'Ser la escuela y compañía teatral de referencia en Venezuela, reconocida por la excelencia de su formación y la calidad de sus producciones.', color: 'bg-cyan' },
              { titulo: 'Valores', texto: 'Excelencia artística, compromiso comunitario, creatividad constante, respeto por la diversidad y pasión inquebrantable por el teatro.', color: 'bg-azul' },
            ].map(({ titulo, texto, color }) => (
              <div key={titulo} className="card p-7">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4`}>
                  <Star size={18} className="text-white" />
                </div>
                <h3 className="font-display text-2xl text-gray-900 mb-3">{titulo}</h3>
                <p className="text-gray-500 leading-relaxed">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Línea del tiempo */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-heading font-bold text-cyan uppercase tracking-widest mb-2">Trayectoria</p>
          <h2 className="font-display text-display-sm text-gray-900">Nuestra historia</h2>
          <div className="brand-divider mx-auto mt-3" />
        </div>
        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-brand-v hidden md:block" />
          <div className="space-y-8">
            {HITOS.map((hito, i) => (
              <div key={i} className={`flex gap-8 md:gap-0 md:items-center ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                <div className="md:w-1/2 md:px-10">
                  <div className={`card p-5 ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                    <span className="inline-block text-xs font-heading font-bold text-cyan uppercase tracking-wider bg-cyan/10 px-3 py-1 rounded-full mb-2">{hito.año}</span>
                    <h3 className="font-heading font-bold text-gray-900 text-lg">{hito.titulo}</h3>
                    <p className="text-gray-500 text-sm mt-1">{hito.desc}</p>
                  </div>
                </div>
                <div className="hidden md:flex w-0 relative justify-center">
                  <div className="w-4 h-4 rounded-full bg-gradient-brand border-4 border-white shadow-brand z-10" />
                </div>
                <div className="md:w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Directores */}
      <section className="py-16 section-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-sm font-heading font-bold text-cyan uppercase tracking-widest mb-2">Liderazgo</p>
            <h2 className="font-display text-display-sm text-gray-900">Nuestro Equipo</h2>
            <div className="brand-divider mx-auto mt-3" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {/* Directores fijos */}
  {[
    { nombre: 'Antonio Cuevas', rol: 'Director y Co-fundador',   ig: '@antoniocuevass', foto: '/antonio.jpg', ini: 'AC' },
    { nombre: 'Daifra Blanco',  rol: 'Directora y Co-fundadora', ig: '@daifrablanco',   foto: '/daifra.jpg',  ini: 'DB' },
  ].map(({ nombre, rol, ig, foto, ini }) => (
    <div key={nombre} className="card p-6 text-center">
      <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden border-2 border-azul/30">
        <img src={foto} alt={nombre} className="w-full h-full object-cover"
          onError={e => {
            e.target.style.display = 'none';
            e.target.parentElement.style.background = 'linear-gradient(135deg,#3333CC,#299FE3)';
            e.target.parentElement.style.display = 'flex';
            e.target.parentElement.style.alignItems = 'center';
            e.target.parentElement.style.justifyContent = 'center';
            e.target.parentElement.innerHTML = `<span style="color:white;font-weight:bold;font-size:1.2rem">${ini}</span>`;
          }} />
      </div>
      <h3 className="font-heading font-bold text-gray-900">{nombre}</h3>
      <p className="text-cyan text-sm font-heading mt-0.5">{rol}</p>
      <a href={`https://instagram.com/${ig.slice(1)}`} target="_blank" rel="noopener noreferrer"
        className="text-gray-400 hover:text-azul text-xs mt-2 block transition-colors">{ig}</a>
    </div>
  ))}
            {/* Profesores dinámicos */}
            {profesores.map(p => (
              <div key={p.id} className="card p-6 text-center">
                {p.fotoPerfil
                  ? <img src={p.fotoPerfil} alt={p.nombre} className="w-20 h-20 rounded-full object-cover mx-auto mb-4" />
                  : <div className="w-20 h-20 rounded-full bg-gradient-subtle mx-auto mb-4 flex items-center justify-center text-azul text-xl font-bold border-2 border-azul/20">
                      {p.nombre?.[0]?.toUpperCase()}
                    </div>
                }
                <h3 className="font-heading font-bold text-gray-900">{p.nombre}</h3>
                <p className="text-cyan text-sm font-heading mt-0.5">Profesor</p>
                {p.especialidad && <p className="text-gray-400 text-xs mt-1">{p.especialidad}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
