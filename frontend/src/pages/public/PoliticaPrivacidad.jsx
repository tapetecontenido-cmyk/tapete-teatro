// src/pages/public/PoliticaPrivacidad.jsx
export default function PoliticaPrivacidad() {
  return (
    <div className="min-h-screen pt-24 pb-16 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-display-sm text-gray-900 mb-2">Política de Privacidad</h1>
        <p className="text-gray-400 text-sm mb-8">Última actualización: junio 2026</p>

        <div className="card p-8 space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">1. Responsable del tratamiento</h2>
            <p>
              Esta Política de Privacidad aplica al sitio web tapeteteatro.com (en adelante, "el Sitio"), operado por
              <strong> Asociación Civil "Tapete (Taller Permanente de Teatro)"</strong>, RIF J-404914919,
              con domicilio en Caracas, Venezuela (en adelante, "Tapete Teatro", "nosotros").
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">2. Datos que recopilamos</h2>
            <p>Dependiendo de cómo uses el Sitio, podemos recopilar:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Datos de registro: nombre, cédula o pasaporte, correo electrónico, teléfono.</li>
              <li>Datos de inscripción a talleres: información del alumno y, cuando corresponda, del padre, madre o representante legal.</li>
              <li>Mensajes enviados a través del formulario de contacto.</li>
              <li>Datos técnicos básicos de navegación (tipo de dispositivo, páginas visitadas) recopilados mediante cookies, ver nuestra <a href="/politica-cookies" className="text-azul hover:underline">Política de Cookies</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">3. Menores de edad</h2>
            <p>
              Tapete Teatro ofrece talleres dirigidos a niños, niñas y adolescentes. En estos casos, el registro y la
              solicitud de inscripción deben ser realizados por el padre, madre o representante legal del menor, quien
              es responsable de la veracidad de los datos suministrados. No recopilamos directamente datos de menores
              de edad sin la intervención de un adulto responsable.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">4. Finalidad del tratamiento</h2>
            <p>Usamos los datos recopilados para:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Gestionar el registro de usuarios y sus perfiles.</li>
              <li>Procesar solicitudes de inscripción a talleres.</li>
              <li>Dar acceso al contenido del Camerino a alumnos inscritos y aprobados.</li>
              <li>Responder consultas enviadas por el formulario de contacto.</li>
              <li>Comunicar información relevante sobre obras, talleres y actividades de Tapete Teatro.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">5. Almacenamiento y seguridad</h2>
            <p>
              Los datos se almacenan utilizando servicios de terceros con estándares de seguridad reconocidos:
              Google Firebase (autenticación y base de datos) y Cloudinary (almacenamiento de imágenes y archivos).
              Aplicamos medidas técnicas razonables para proteger la información contra accesos no autorizados.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">6. Compartición de datos</h2>
            <p>
              No vendemos ni cedemos tus datos personales a terceros con fines comerciales. Solo compartimos
              información con proveedores tecnológicos necesarios para operar el Sitio (Firebase, Cloudinary,
              Cloudflare), quienes procesan los datos conforme a sus propias políticas de privacidad.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">7. Tus derechos</h2>
            <p>
              Puedes solicitar acceso, corrección o eliminación de tus datos personales, o de los de tu representado
              si eres padre, madre o representante legal, escribiendo a través de nuestra página de
              <a href="/contacto" className="text-azul hover:underline"> Contacto</a>.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">8. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta Política de Privacidad ocasionalmente. La fecha de la última actualización
              aparece al inicio de este documento.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">9. Contacto</h2>
            <p>
              Para cualquier consulta sobre esta política, contáctanos a través de nuestra
              <a href="/contacto" className="text-azul hover:underline"> página de Contacto</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
