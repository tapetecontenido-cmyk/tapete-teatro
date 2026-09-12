// src/pages/public/PoliticaCookies.jsx
export default function PoliticaCookies() {
  return (
    <div className="min-h-screen pt-24 pb-16 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-display-sm text-gray-900 mb-2">Política de Cookies</h1>
        <p className="text-gray-400 text-sm mb-8">Última actualización: junio 2026</p>

        <div className="card p-8 space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">1. ¿Qué son las cookies?</h2>
            <p>
              Las cookies son pequeños archivos que se almacenan en tu navegador cuando visitas un sitio web.
              Se utilizan para recordar tus preferencias, mantener tu sesión iniciada y mejorar tu experiencia de navegación.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">2. Cookies que utilizamos</h2>
            <ul className="list-disc list-inside mt-2 space-y-2">
              <li>
                <strong>Cookies esenciales:</strong> necesarias para el funcionamiento del Sitio, como mantener tu
                sesión iniciada (Firebase Authentication). No pueden desactivarse porque el Sitio no funcionaría correctamente sin ellas.
              </li>
              <li>
                <strong>Cookies de seguridad:</strong> utilizadas por Cloudflare Turnstile para verificar que las
                solicitudes de contacto y registro provienen de personas reales y no de bots automatizados.
              </li>
              <li>
                <strong>Cookies de preferencias:</strong> recuerdan si aceptaste o rechazaste el uso de cookies, para no
                mostrarte el aviso repetidamente.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">3. Cookies de terceros</h2>
            <p>
              Algunos servicios integrados en el Sitio pueden establecer sus propias cookies conforme a sus políticas:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Google Firebase (autenticación y base de datos)</li>
              <li>Cloudflare Turnstile (verificación de seguridad)</li>
              <li>Google Maps (mapa de ubicación en la página de Contacto)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">4. Cómo gestionar las cookies</h2>
            <p>
              Puedes aceptar o rechazar el uso de cookies no esenciales desde el banner que aparece al ingresar al
              Sitio por primera vez. También puedes configurar tu navegador para bloquear o eliminar cookies, aunque
              esto podría afectar el funcionamiento de algunas secciones del Sitio, como el inicio de sesión.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">5. Contacto</h2>
            <p>
              Si tienes dudas sobre esta Política de Cookies, contáctanos a través de nuestra
              <a href="/contacto" className="text-azul hover:underline"> página de Contacto</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
