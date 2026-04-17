# 🎭 Tapete Teatro — Plataforma Web Completa

Plataforma web para **Tapete Teatro**, escuela y compañía teatral venezolana.  
Stack: React + Tailwind CSS · Node.js + Express · Firebase (Auth, Firestore, Storage) · Vercel + Railway

---

## 📁 Estructura del Proyecto

```
tapete-teatro/
├── frontend/          # React + Tailwind CSS → deploy en Vercel
├── backend/           # Node.js + Express → deploy en Railway
├── firebase/          # Reglas de seguridad y esquema de Firestore
└── README.md
```

---

## ⚙️ Variables de Entorno

### Frontend (`frontend/.env`)
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_BACKEND_URL=https://tu-backend.railway.app
```

### Backend (`backend/.env`)
```env
PORT=3001
FRONTEND_URL=https://tapeteteatro.vercel.app

# Firebase Admin SDK
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Email (Resend o Nodemailer)
RESEND_API_KEY=
EMAIL_FROM=noreply@tapeteteatro.com

# VerificaPago.com (opcional)
VERIFICAPAGO_API_KEY=
VERIFICAPAGO_ENDPOINT=https://api.verificapago.com/v1/verificar

# Seguridad
SESSION_SECRET=cambia_esto_por_un_string_aleatorio_largo
```

---

## 🚀 Instalación Local

### 1. Clonar y configurar Firebase

```bash
# Instalar Firebase CLI
npm install -g firebase-tools
firebase login
firebase init  # selecciona Firestore, Storage, Auth
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # Completar con tus credenciales
npm run dev            # http://localhost:5173
```

### 3. Backend

```bash
cd backend
npm install
cp .env.example .env   # Completar con tus credenciales
npm run dev            # http://localhost:3001
```

---

## 🌐 Despliegue

### Frontend → Vercel

```bash
cd frontend
npm install -g vercel
vercel --prod
# Configurar variables de entorno en el dashboard de Vercel
```

### Backend → Railway

1. Crear cuenta en [railway.app](https://railway.app)
2. Nuevo proyecto → Deploy desde GitHub
3. Seleccionar carpeta `backend/`
4. Agregar variables de entorno en Railway dashboard
5. Railway genera URL automáticamente → copiarla en `VITE_BACKEND_URL` del frontend

### Firebase

```bash
cd firebase
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

---

## 👤 Primer Admin

Después del despliegue, registra un usuario normal y luego ejecuta en la consola de Firebase:

```javascript
// En Firebase Console → Firestore → users → {uid}
// Cambiar campo: role: "admin"
```

O via backend con el script incluido:
```bash
cd backend
node scripts/set-admin.js email@ejemplo.com
```

---

## 💰 Costo estimado ($100 USD inicial)

| Servicio | Plan | Costo |
|----------|------|-------|
| Firebase (Auth + Firestore + Storage) | Spark (gratuito) | $0 |
| Vercel (frontend) | Hobby (gratuito) | $0 |
| Railway (backend) | Trial → Starter $5/mes | $5/mes |
| Dominio .com | Namecheap | ~$10/año |
| Cloudflare | Free | $0 |
| **Total mes 1** | | **~$15** |

---

## 📞 Contacto Tapete Teatro

- WhatsApp: +58 424-228-34-71 / +58 424-179-08-60
- Instagram: @tapeteteatro
- Directores: @antoniocuevass · @daifrablanco
