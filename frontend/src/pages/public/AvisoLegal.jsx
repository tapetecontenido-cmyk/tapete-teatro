// src/pages/public/AvisoLegal.jsx
export default function AvisoLegal() {
  return (
    <div className="min-h-screen pt-24 pb-16 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-display-sm text-gray-900 mb-2">Aviso Legal y Términos de Uso</h1>
        <p className="text-gray-400 text-sm mb-8">Última actualización: junio 2026</p>

        <div className="card p-8 space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">1. Identificación del titular</h2>
            <p>
              El sitio web tapeteteatro.com es operado por <strong>Asociación Civil "Tapete (Taller Permanente de Teatro)"</strong>,
              RIF J-404914919, con domicilio en Caracas, Venezuela.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">2. Objeto del sitio</h2>
            <p>
              Este sitio tiene como finalidad brindar información sobre las obras, talleres, noticias y actividades
              de Tapete Teatro, así como permitir el registro de usuarios, la solicitud de inscripción a talleres,
              y el acceso a materiales educativos a través del Camerino para alumnos aprobados.
            </p>
            <p className="mt-2">
              El Sitio no procesa pagos ni ventas en línea. Cualquier transacción relacionada con inscripciones o
              entradas se coordina directamente con el equipo de Tapete Teatro por los canales de contacto indicados.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">3. Condiciones de uso</h2>
            <p>Al usar este Sitio, aceptas:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Proporcionar información veraz al registrarte o solicitar una inscripción.</li>
              <li>No utilizar el Sitio con fines ilícitos o que puedan dañar su funcionamiento.</li>
              <li>No intentar acceder sin autorización a áreas restringidas como el panel administrativo o el Camerino de otros usuarios.</li>
              <li>Que la inscripción de menores de edad a talleres es responsabilidad del padre, madre o representante legal.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">4. Propiedad intelectual</h2>
            <p>
              Los contenidos del Sitio (textos, imágenes, logotipos, materiales de los talleres) son propiedad de
              Tapete Teatro o de sus respectivos profesores y colaboradores. Está prohibida su reproducción,
              distribución o uso comercial sin autorización previa.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">5. Contenido del Camerino</h2>
            <p>
              El material educativo (PDFs, enlaces, mensajes) compartido en el Camerino es de uso exclusivo para
              alumnos inscritos y aprobados en el taller correspondiente. Queda prohibida su reproducción o
              distribución fuera de este contexto sin autorización del profesor o de Tapete Teatro.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">6. Limitación de responsabilidad</h2>
            <p>
              Tapete Teatro no se hace responsable por interrupciones temporales del Sitio, errores técnicos,
              o por el uso indebido que terceros puedan hacer de la información publicada en el mismo.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">7. Legislación aplicable</h2>
            <p>
              Este Aviso Legal se rige por las leyes de la República Bolivariana de Venezuela.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">8. Contacto</h2>
            <p>
              Para cualquier consulta relacionada con este Aviso Legal, puedes escribirnos a través de nuestra
              <a href="/contacto" className="text-azul hover:underline"> página de Contacto</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
