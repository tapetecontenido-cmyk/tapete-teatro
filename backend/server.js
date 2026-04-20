// backend/server.js
// Servidor Express — Tapete Teatro Backend
// Comentado en español, código limpio y modular
require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const rateLimit   = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const admin       = require('firebase-admin');

// ── Inicializar Firebase Admin SDK ─────────────────────────────────────
const serviceAccount = {
  type:                        'service_account',
  project_id:                  process.env.FIREBASE_PROJECT_ID,
  private_key_id:              process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key:                 process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email:                process.env.FIREBASE_CLIENT_EMAIL,
  client_id:                   process.env.FIREBASE_CLIENT_ID,
  auth_uri:                    'https://accounts.google.com/o/oauth2/auth',
  token_uri:                   'https://oauth2.googleapis.com/token',
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
// ── Cloudinary ─────────────────────────────────────────────────────────
const cloudinary = require('cloudinary').v2;
const multer      = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});
// ── Express setup ──────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3001;
app.set('trust proxy', 1);

// ── Middlewares de seguridad ───────────────────────────────────────────

// Helmet: headers de seguridad HTTP
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false, // Configurar según necesidad
}));

// CORS: solo permitir el frontend
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:4173',
  ],
  methods:          ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders:   ['Content-Type', 'Authorization'],
  credentials:      true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting global
const limiterGlobal = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max:      100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Demasiadas solicitudes. Intenta en 15 minutos.' },
});
app.use('/api', limiterGlobal);

// Rate limiting estricto para auth
const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message: { error: 'Demasiados intentos de autenticación.' },
});

// Rate limiting para uploads
const limiterUpload = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message: { error: 'Demasiadas subidas. Intenta en 15 minutos.' },
});

// ── Middleware: verificar token Firebase ───────────────────────────────
const verificarToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    const token   = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    req.uid   = decoded.uid;
    req.email = decoded.email;

    // Obtener rol del usuario desde Firestore
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || !userDoc.data().activo) {
      return res.status(403).json({ error: 'Cuenta inactiva o no encontrada' });
    }
    req.role  = userDoc.data().role;
    req.perfil = userDoc.data();
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// ── Middleware: verificar rol admin ────────────────────────────────────
const soloAdmin = (req, res, next) => {
  if (req.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
};

// ── RUTAS ──────────────────────────────────────────────────────────────
// ── Tasa BCV ───────────────────────────────────────────────────────────
app.get('/api/tasa-bcv', async (req, res) => {
  const fuentes = [
    'https://pydolarve.org/api/v1/euro?monitor=bcv',
    'https://ve.dolarapi.com/v1/euros/oficial',
  ];

  for (const url of fuentes) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = await response.json();

      if (data.price)   return res.json({ tasa: parseFloat(data.price) });
      if (data.promedio) return res.json({ tasa: parseFloat(data.promedio) });
      if (data.tasa)    return res.json({ tasa: parseFloat(data.tasa) });
    } catch {
      continue;
    }
  }

  res.status(503).json({ error: 'No se pudo obtener la tasa' });
});
// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// ── Subir archivo a Cloudinary ─────────────────────────────────────────
const limiterUpload = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message: { error: 'Demasiadas subidas. Intenta en 15 minutos.' },
});

app.post('/api/upload', limiterUpload, upload.single('archivo'), async (req, res) => {
  // Validar tipo MIME
  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!req.file || !tiposPermitidos.includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Tipo de archivo no permitido' });
  }
  try {
    const resultado = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: req.body.carpeta || 'tapete-teatro' },
        (error, result) => error ? reject(error) : resolve(result)
      );
      stream.end(req.file.buffer);
    });
    res.json({ url: resultado.secure_url });
  } catch (err) {
    console.error('Error Cloudinary:', err.message);
    res.status(500).json({ error: 'Error al subir archivo' });
  }
});
// ── Rutas de reservas ──────────────────────────────────────────────────
app.post('/api/reservas/verificar',
  [
    body('reservaId').isString().trim().notEmpty(),
    body('referencia').isString().trim().notEmpty().isLength({ max: 50 }),
  ],
  async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) return res.status(400).json({ errores: errores.array() });

    const { reservaId, referencia, metodoPago } = req.body;

    try {
      // ── Opción B: Verificación automática con VerificaPago.com ────────
      const verificaAutoActivo = process.env.VERIFICAPAGO_ACTIVO === 'true';
      const apiKey             = process.env.VERIFICAPAGO_API_KEY;
      const endpoint           = process.env.VERIFICAPAGO_ENDPOINT;

      if (verificaAutoActivo && apiKey && endpoint) {
        try {
          const response = await fetch(endpoint, {
            method:  'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ referencia, metodo: metodoPago }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.verificado === true) {
              // Confirmar reserva automáticamente
              await db.collection('reservas').doc(reservaId).update({
                estado:              'confirmada',
                verificadoAutomatico: true,
                actualizadoEn:       admin.firestore.FieldValue.serverTimestamp(),
              });
              return res.json({ verificado: true, metodo: 'automatico' });
            }
          }
        } catch (verError) {
          console.warn('VerificaPago falló, usando verificación manual:', verError.message);
          // Cae a verificación manual (Opción A)
        }
      }

      // Opción A: Queda en pendiente para revisión manual
      return res.json({ verificado: false, metodo: 'manual', mensaje: 'Pendiente de verificación manual' });

    } catch (err) {
      console.error('Error verificando reserva:', err.message);
      return res.status(500).json({ error: 'Error interno' });
    }
  }
);

// ── Notificar confirmación/rechazo al cliente ──────────────────────────
app.post('/api/reservas/notificar',
  [
    body('reservaId').isString().trim().notEmpty(),
    body('accion').isIn(['confirmar', 'rechazar']),
  ],
  async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) return res.status(400).json({ errores: errores.array() });

    const { reservaId, accion, nota } = req.body;

    try {
      // Obtener reserva
      const reservaDoc = await db.collection('reservas').doc(reservaId).get();
      if (!reservaDoc.exists) return res.status(404).json({ error: 'Reserva no encontrada' });

      const reserva = reservaDoc.data();
      const email   = reserva.comprador?.email;

      if (!email) return res.status(400).json({ error: 'El comprador no tiene email' });

      // Enviar email via Resend (o Nodemailer)
      await enviarEmail({
        to:      email,
        subject: accion === 'confirmar'
          ? `✅ Reserva confirmada — Tapete Teatro #${reservaId.slice(-8).toUpperCase()}`
          : `❌ Reserva no aprobada — Tapete Teatro`,
        html: accion === 'confirmar'
  ? `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #3333CC, #299FE3); padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">✅ ¡Pago Confirmado!</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Tapete Teatro</p>
      </div>
      <div style="padding: 32px; background: white; border-radius: 0 0 16px 16px; border: 1px solid #eee;">
        <p>Hola, <strong>${reserva.comprador?.nombre}</strong>.</p>
        <p>Tu pago ha sido <strong style="color: #22c55e;">verificado y confirmado</strong>. ¡Tu entrada está lista!</p>
        <div style="background: #f8f9fa; padding: 16px; border-radius: 12px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>ID de reserva:</strong> #${reservaId.slice(-8).toUpperCase()}</p>
          <p style="margin: 4px 0;"><strong>Obra:</strong> ${reserva.obraNombre || '—'}</p>
          <p style="margin: 4px 0;"><strong>Asientos:</strong> ${reserva.asientos?.map(s => '#' + s).join(', ')}</p>
          <p style="margin: 4px 0;"><strong>Total pagado:</strong> $${reserva.total} USD</p>
        </div>
        ${nota ? `<div style="background: #f0f9ff; border-left: 4px solid #299FE3; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 16px 0;"><p style="margin: 0; color: #1B7FB5; font-size: 14px;">${nota}</p></div>` : ''}
        <p style="color: #6b7280; font-size: 14px;">Recuerda presentar tu identificación en la taquilla el día de la función.</p>
        <p>¡Nos vemos en el teatro!</p>
        <p style="color: #3333CC; font-weight: bold; margin-top: 24px;">Tapete Teatro</p>
      </div>
    </div>
  `
          : `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #ef4444; padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Reserva No Aprobada</h1>
              </div>
              <div style="padding: 32px; background: white; border-radius: 0 0 16px 16px; border: 1px solid #eee;">
                <p>Hola, <strong>${reserva.comprador?.nombre}</strong>.</p>
                <p>Lamentablemente tu reserva no pudo ser aprobada.</p>
                ${nota ? `<p><strong>Motivo:</strong> ${nota}</p>` : ''}
                <p>Si tienes dudas, contáctanos por WhatsApp: <strong>+58 424-228-34-71</strong></p>
                <p style="color: #3333CC; font-weight: bold;">Tapete Teatro</p>
              </div>
            </div>
          `
      });

      return res.json({ ok: true });
    } catch (err) {
      console.error('Error notificando:', err.message);
      return res.status(500).json({ error: 'Error enviando notificación' });
    }
  }
);
// ── Email de recepción de reserva ──────────────────────────────────────
app.post('/api/reservas/recibida', async (req, res) => {
  const { reservaId, comprador, asientos, total, metodoPago, obraNombre } = req.body;
  if (!comprador?.email) return res.status(400).json({ error: 'Email requerido' });

  try {
    await enviarEmail({
      to: comprador.email,
      subject: `Reserva recibida — Tapete Teatro #${reservaId.slice(-8).toUpperCase()}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3333CC, #299FE3); padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">¡Reserva Recibida!</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Tapete Teatro</p>
          </div>
          <div style="padding: 32px; background: white; border-radius: 0 0 16px 16px; border: 1px solid #eee;">
            <p>Hola, <strong>${comprador.nombre}</strong>.</p>
            <p>Hemos recibido tu solicitud de reserva. Tu pago está siendo verificado por nuestro equipo.</p>
            <div style="background: #f8f9fa; padding: 16px; border-radius: 12px; margin: 16px 0;">
              <p style="margin: 4px 0;"><strong>ID de reserva:</strong> #${reservaId.slice(-8).toUpperCase()}</p>
              <p style="margin: 4px 0;"><strong>Obra:</strong> ${obraNombre || '—'}</p>
              <p style="margin: 4px 0;"><strong>Asientos:</strong> ${asientos?.map(s => '#' + s).join(', ')}</p>
              <p style="margin: 4px 0;"><strong>Total:</strong> $${total} USD</p>
              <p style="margin: 4px 0;"><strong>Método de pago:</strong> ${metodoPago?.replace('_', ' ')}</p>
            </div>
            <div style="background: #f0f9ff; border-left: 4px solid #299FE3; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 16px 0;">
              <p style="margin: 0; color: #1B7FB5; font-size: 14px;">Recibirás una confirmación final una vez que verifiquemos tu pago. Esto puede tomar hasta 24 horas hábiles.</p>
            </div>
            <p>Si tienes alguna duda, contáctanos por WhatsApp: <strong>+58 424-228-34-71</strong></p>
            <p style="color: #3333CC; font-weight: bold; margin-top: 24px;">Tapete Teatro</p>
          </div>
        </div>
      `
    });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Error enviando email de recepción:', err.message);
    return res.status(500).json({ error: 'Error enviando email' });
  }
});
// ── Contacto ───────────────────────────────────────────────────────────
app.post('/api/contacto',
  limiterAuth,
  [
    body('nombre').isString().trim().notEmpty().isLength({ max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('asunto').isString().trim().notEmpty().isLength({ max: 200 }),
    body('mensaje').isString().trim().notEmpty().isLength({ max: 2000 }),
  ],
  async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) return res.status(400).json({ errores: errores.array() });

    const { nombre, email, asunto, mensaje } = req.body;

    try {
      // Guardar en Firestore
      await db.collection('mensajes_contacto').add({
        nombre, email, asunto, mensaje,
        creadoEn: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Notificar a los directores por email
      await enviarEmail({
        to:      'contacto@tapeteteatro.com', // Cambiar al email real
        subject: `Nuevo mensaje: ${asunto}`,
        html:    `<p><strong>De:</strong> ${nombre} (${email})</p><p>${mensaje}</p>`,
      });

      return res.json({ ok: true, mensaje: 'Mensaje enviado correctamente' });
    } catch (err) {
      console.error('Error enviando contacto:', err.message);
      return res.status(500).json({ error: 'Error enviando el mensaje' });
    }
  }
);

// ── Función helper: enviar email ───────────────────────────────────────
async function enviarEmail({ to, subject, html }) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Tapete Teatro <onboarding@resend.dev>`,
        to:      [to],
        subject,
        html,
      }),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Resend error: ${err}`);
    }
    return;
  }

  // Fallback: Nodemailer con Gmail
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host:    'smtp.gmail.com',
    port:    465,
    secure:  true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout:   10000,
    socketTimeout:     15000,
  });
  await transporter.sendMail({
    from: `Tapete Teatro <onboarding@resend.dev>`,
    to,
    subject,
    html,
  });
}

// ── Manejo de errores global ───────────────────────────────────────────
app.use((err, req, res, next) => {
  // No exponer stack trace al usuario final
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ── Iniciar servidor ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🎭 Tapete Teatro Backend corriendo en puerto ${PORT}`);
  console.log(`🌍 Frontend permitido: ${process.env.FRONTEND_URL}`);
});

module.exports = app;
