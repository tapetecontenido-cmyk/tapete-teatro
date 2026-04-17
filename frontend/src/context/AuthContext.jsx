// src/context/AuthContext.jsx
// Contexto de autenticación global — Tapete Teatro
import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);   // datos de Firebase Auth
  const [perfil, setPerfil]     = useState(null);   // datos de Firestore
  const [cargando, setCargando] = useState(true);

  // ── Escuchar cambios de sesión ─────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await cargarPerfil(firebaseUser.uid);
      } else {
        setUser(null);
        setPerfil(null);
      }
      setCargando(false);
    });
    return unsubscribe;
  }, []);

  // ── Cargar perfil desde Firestore ──────────────────────────────────────
  const cargarPerfil = async (uid) => {
    try {
      const ref  = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setPerfil({ id: uid, ...snap.data() });
      }
    } catch (err) {
      console.error('Error cargando perfil:', err.message);
    }
  };

  // ── Registro de alumno ─────────────────────────────────────────────────
  const registrar = async ({ nombre, cedula, telefono, email, password }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: nombre });

    const perfilData = {
      nombre,
      cedula,
      telefono,
      email,
      role:        'alumno',
      activo:      true,
      fotoPerfil:  '',
      bio:         '',
      nivel:       '',
      talleres:    [],
      creadoEn:    serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', cred.user.uid), perfilData);
    setPerfil({ id: cred.user.uid, ...perfilData });
    return cred.user;
  };

  // ── Inicio de sesión ───────────────────────────────────────────────────
  const iniciarSesion = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await cargarPerfil(cred.user.uid);
    return cred.user;
  };

  // ── Cerrar sesión ──────────────────────────────────────────────────────
  const cerrarSesion = () => signOut(auth);

  // ── Recuperar contraseña ───────────────────────────────────────────────
  const recuperarPassword = (email) => sendPasswordResetEmail(auth, email);

  // ── Helpers de rol ─────────────────────────────────────────────────────
  const esAdmin    = perfil?.role === 'admin';
  const esProfesor = perfil?.role === 'profesor';
  const esAlumno   = perfil?.role === 'alumno';

  const value = {
    user,
    perfil,
    cargando,
    registrar,
    iniciarSesion,
    cerrarSesion,
    recuperarPassword,
    cargarPerfil,
    esAdmin,
    esProfesor,
    esAlumno,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
