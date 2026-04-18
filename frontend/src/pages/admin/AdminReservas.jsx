// src/pages/admin/AdminReservas.jsx
import { useState, useEffect } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  doc, updateDoc, serverTimestamp, addDoc,
  arrayUnion, arrayRemove, deleteDoc
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { CheckCircle, XCircle, Eye, Search, Filter, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

// ── Modal de detalle de reserva ────────────────────────────────────────
function ReservaModal({ reserva, onClose, onConfirmar, onRechazar }) {
  const [nota, setNota]         = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleAccion = async (accion) => {
    setEnviando(true);
    try {
      if (accion === 'confirmar') await onConfirmar(reserva.id, nota);
      else await onRechazar(reserva.id, nota);
      onClose();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-heading font-bold text-xl text-gray-900">
            Reserva #{reserva.id.slice(-8).toUpperCase()}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <XCircle size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 font-heading">Estado actual:</span>
            <span className={clsx('badge',
              reserva.estado === 'pendiente'  ? 'badge-pending' :
              reserva.estado === 'confirmada' ? 'badge-confirmed' : 'badge-cancelled'
            )}>{reserva.estado}</span>
          </div>

          <div>
            <p className="text-xs font-heading font-bold text-gray-400 uppercase tracking-wide mb-3">Datos del comprador</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-600 font-heading">Nombre:</span> <strong className="text-gray-900">{reserva.comprador?.nombre}</strong></div>
              <div><span className="text-gray-600 font-heading">Cédula:</span> <strong className="text-gray-900">{reserva.comprador?.cedula}</strong></div>
              <div><span className="text-gray-600 font-heading">Teléfono:</span> <strong className="text-gray-900">{reserva.comprador?.telefono}</strong></div>
              <div><span className="text-gray-600 font-heading">Email:</span> <strong className="text-gray-900">{reserva.comprador?.email}</strong></div>
            </div>
          </div>

          <div>
            <p className="text-xs font-heading font-bold text-gray-400 uppercase tracking-wide mb-3">Detalles de la reserva</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-600 font-heading">Obra:</span> <strong className="text-gray-900">{reserva.obraNombre}</strong></div>
              <div><span className="text-gray-600 font-heading">Total:</span> <strong className="text-azul">${reserva.total} USD</strong></div>
              <div><span className="text-gray-600 font-heading">Método:</span> <strong className="text-gray-900 capitalize">{reserva.metodoPago?.replace('_', ' ')}</strong></div>
              <div><span className="text-gray-600 font-heading">Referencia:</span> <strong className="text-gray-900">{reserva.referencia}</strong></div>
            </div>
            <div className="mt-3">
  <span className="text-gray-400 text-sm">Asientos: </span>
  <div className="flex flex-wrap gap-1.5 mt-1">
    {reserva.asientos?.map(s => (
      <span key={s} className="badge bg-azul/10 text-azul">#{s}</span>
    ))}
  </div>
  {reserva.funcionId && reserva.asientos?.length > 0 && (
    <button
      onClick={async () => {
        try {
          const { updateDoc, doc, arrayRemove } = await import('firebase/firestore');
          const { db } = await import('../../services/firebase');
          await updateDoc(doc(db, 'asientosOcupados', reserva.funcionId), {
            ocupados:   arrayRemove(...reserva.asientos),
            reservados: arrayRemove(...reserva.asientos),
          });
          toast.success('Asientos liberados correctamente');
        } catch (err) {
          toast.error('Error al liberar: ' + err.message);
        }
      }}
      className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-green-300 text-green-600 text-xs font-heading font-bold hover:bg-green-50 transition-colors"
    >
      🔓 Liberar estos asientos
    </button>
  )}
</div>
          </div>

          <div>
            <p className="text-xs font-heading font-bold text-gray-400 uppercase tracking-wide mb-3">Comprobante de pago</p>
            {reserva.comprobanteUrl ? (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {reserva.comprobanteUrl.includes('.pdf') ? (
                  <a href={reserva.comprobanteUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-azul font-heading font-bold text-sm">
                    <ExternalLink size={18} /> Ver PDF del comprobante
                  </a>
                ) : (
                  <a href={reserva.comprobanteUrl} target="_blank" rel="noopener noreferrer">
                    <img src={reserva.comprobanteUrl} alt="Comprobante"
                      className="w-full max-h-64 object-contain bg-gray-50 hover:opacity-90 transition-opacity" />
                  </a>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-sm italic">No se subió comprobante</p>
            )}
          </div>

          {reserva.estado === 'pendiente' && (
            <div>
              <label className="label-field">Nota para el cliente (opcional)</label>
              <textarea value={nota} onChange={e => setNota(e.target.value)}
                placeholder="Ej: Pago verificado correctamente."
                rows={3} className="input-field resize-none" />
            </div>
          )}

          {reserva.creadoEn && (
            <p className="text-xs text-gray-400">
              Reserva creada el {format(
                reserva.creadoEn.toDate?.() || new Date(reserva.creadoEn),
                "d 'de' MMMM yyyy 'a las' HH:mm", { locale: es }
              )}
            </p>
          )}
        </div>

        {reserva.estado === 'pendiente' && (
          <div className="p-6 border-t border-gray-100 flex gap-3">
            <button onClick={() => handleAccion('rechazar')} disabled={enviando}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-red-200 text-red-600 font-heading font-bold text-sm hover:bg-red-50 transition-colors disabled:opacity-50">
              <XCircle size={18} /> Rechazar
            </button>
            <button onClick={() => handleAccion('confirmar')} disabled={enviando}
              className="flex-1 btn-primary py-3 gap-2">
              {enviando ? <span className="spinner w-5 h-5" /> : <><CheckCircle size={18} /> Confirmar pago</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página principal de reservas ───────────────────────────────────────
export default function AdminReservas() {
  const [reservas,      setReservas]      = useState([]);
  const [filtroEstado,  setFiltroEstado]  = useState('todas');
  const [busqueda,      setBusqueda]      = useState('');
  const [reservaModal,  setReservaModal]  = useState(null);
  const [cargando,      setCargando]      = useState(true);
  const [seleccionadas, setSeleccionadas] = useState(new Set());

  useEffect(() => {
    const q = query(collection(db, 'reservas'), orderBy('creadoEn', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setReservas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCargando(false);
    });
    return unsub;
  }, []);

  // ── Confirmar reserva ──────────────────────────────────────────────
  const confirmarReserva = async (reservaId, nota) => {
    try {
      await updateDoc(doc(db, 'reservas', reservaId), {
        estado: 'confirmada', notaAdmin: nota, actualizadoEn: serverTimestamp(),
      });
      const reserva = reservas.find(r => r.id === reservaId);
      if (reserva?.funcionId && reserva?.asientos) {
        const asientosRef = doc(db, 'asientosOcupados', reserva.funcionId);
        try {
          await updateDoc(asientosRef, {
            ocupados:   arrayUnion(...reserva.asientos),
            reservados: arrayRemove(...reserva.asientos),
          });
        } catch {}
      }
      if (reserva?.userId) {
        await addDoc(collection(db, 'notificaciones'), {
          userId: reserva.userId,
          titulo: '¡Reserva confirmada!',
          mensaje: `Tu reserva #${reservaId.slice(-6).toUpperCase()} para "${reserva.obraNombre}" ha sido confirmada.`,
          leida: false, creadaEn: serverTimestamp(),
        });
      }
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservas/notificar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservaId, accion: 'confirmar', nota }),
      }).catch(() => {});
      toast.success('Reserva confirmada y cliente notificado');
    } catch (err) {
      toast.error('Error al confirmar: ' + err.message);
    }
  };

  // ── Rechazar reserva ───────────────────────────────────────────────
  const rechazarReserva = async (reservaId, nota) => {
    try {
      await updateDoc(doc(db, 'reservas', reservaId), {
        estado: 'cancelada', notaAdmin: nota, actualizadoEn: serverTimestamp(),
      });
      const reserva = reservas.find(r => r.id === reservaId);
      if (reserva?.asientos && reserva.asientos.length > 0 && reserva.funcionId) {
        const asientosRef = doc(db, 'asientosOcupados', reserva.funcionId);
        try {
          await updateDoc(asientosRef, {
            reservados: arrayRemove(...reserva.asientos),
            ocupados:   arrayRemove(...reserva.asientos),
          });
        } catch {}
      }
      if (reserva?.userId) {
        await addDoc(collection(db, 'notificaciones'), {
          userId: reserva.userId,
          titulo: 'Reserva rechazada',
          mensaje: nota || `Tu reserva #${reservaId.slice(-6).toUpperCase()} no pudo ser confirmada.`,
          leida: false, creadaEn: serverTimestamp(),
        });
      }
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservas/notificar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservaId, accion: 'rechazar', nota }),
      }).catch(() => {});
      toast.success('Reserva rechazada');
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  // ── Exportar Excel ─────────────────────────────────────────────────
  const exportarExcel = () => {
    const fechaHoy = new Date().toLocaleDateString('es-VE').replace(/\//g, '-');
    const filas = [
      ['ID', 'Fecha', 'Nombre', 'Cédula', 'Teléfono', 'Email', 'Obra', 'Asientos', 'Total USD', 'Método', 'Referencia', 'Estado', 'Nota Admin']
    ];
    reservas.forEach(r => {
      filas.push([
        r.id.slice(-8).toUpperCase(),
        r.creadoEn ? (r.creadoEn.toDate?.() || new Date()).toLocaleString('es-VE') : '',
        r.comprador?.nombre || '', r.comprador?.cedula || '',
        r.comprador?.telefono || '', r.comprador?.email || '',
        r.obraNombre || '', r.asientos?.join(', ') || '',
        r.total || 0, r.metodoPago?.replace('_', ' ') || '',
        r.referencia || '', r.estado || '', r.notaAdmin || '',
      ]);
    });
    const csv = filas.map(f => f.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reservas-tapete-teatro-' + fechaHoy + '.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Excel descargado');
  };

  // ── Selección múltiple ─────────────────────────────────────────────
  const toggleSeleccion = (id) => {
    setSeleccionadas(prev => {
      const nueva = new Set(prev);
      nueva.has(id) ? nueva.delete(id) : nueva.add(id);
      return nueva;
    });
  };

  const seleccionarTodas = () => {
    if (seleccionadas.size === reservasFiltradas.length) {
      setSeleccionadas(new Set());
    } else {
      setSeleccionadas(new Set(reservasFiltradas.map(r => r.id)));
    }
  };

  const eliminarSeleccionadas = async () => {
    if (seleccionadas.size === 0) { toast.error('Selecciona al menos una reserva'); return; }
    if (!confirm(`¿Eliminar ${seleccionadas.size} reserva(s)? Esta acción no se puede deshacer.`)) return;
    try {
      for (const id of seleccionadas) {
        await deleteDoc(doc(db, 'reservas', id));
      }
      setSeleccionadas(new Set());
      toast.success('Reservas eliminadas');
    } catch (err) {
      toast.error('Error al eliminar: ' + err.message);
    }
  };

  // ── Filtrar reservas ───────────────────────────────────────────────
  const reservasFiltradas = reservas.filter(r => {
    const matchEstado = filtroEstado === 'todas' || r.estado === filtroEstado;
    const matchBusq   = !busqueda ||
      r.comprador?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.comprador?.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.id.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.referencia?.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchBusq;
  });

  const contadores = {
    todas:      reservas.length,
    pendiente:  reservas.filter(r => r.estado === 'pendiente').length,
    confirmada: reservas.filter(r => r.estado === 'confirmada').length,
    cancelada:  reservas.filter(r => r.estado === 'cancelada').length,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-display-sm text-gray-900">Reservas</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona todas las reservas de entradas</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { key: 'todas',      label: 'Todas' },
          { key: 'pendiente',  label: 'Pendientes' },
          { key: 'confirmada', label: 'Confirmadas' },
          { key: 'cancelada',  label: 'Canceladas' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFiltroEstado(key)}
            className={clsx('px-4 py-2 rounded-xl text-sm font-heading font-bold transition-all',
              filtroEstado === key ? 'bg-azul text-white shadow-brand' : 'bg-white text-gray-600 border border-gray-200 hover:border-azul hover:text-azul'
            )}>
            {label}
            <span className={clsx('ml-2 px-1.5 py-0.5 rounded-full text-xs', filtroEstado === key ? 'bg-white/20' : 'bg-gray-100')}>
              {contadores[key]}
            </span>
          </button>
        ))}
        <button onClick={exportarExcel}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-heading font-bold bg-green-500 text-white hover:bg-green-600 transition-colors ml-auto">
          ↓ Exportar Excel
        </button>
        {seleccionadas.size > 0 && (
          <button onClick={eliminarSeleccionadas}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-heading font-bold bg-red-500 text-white hover:bg-red-600 transition-colors">
            🗑 Eliminar {seleccionadas.size} seleccionada(s)
          </button>
        )}
      </div>

      {/* Buscador */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, email, ID o referencia..." className="input-field pl-10" />
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        {cargando ? (
          <div className="p-8 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : reservasFiltradas.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Filter size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-heading">No se encontraron reservas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs font-heading font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="px-5 py-3 text-left">
                    <input type="checkbox"
                      checked={seleccionadas.size === reservasFiltradas.length && reservasFiltradas.length > 0}
                      onChange={seleccionarTodas}
                      className="w-4 h-4 accent-azul cursor-pointer" />
                  </th>
                  <th className="px-5 py-3 text-left">ID</th>
                  <th className="px-5 py-3 text-left">Cliente</th>
                  <th className="px-5 py-3 text-left hidden md:table-cell">Obra</th>
                  <th className="px-5 py-3 text-left hidden lg:table-cell">Asientos</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3 text-center hidden sm:table-cell">Método</th>
                  <th className="px-5 py-3 text-center">Estado</th>
                  <th className="px-5 py-3 text-center hidden lg:table-cell">Fecha</th>
                  <th className="px-5 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reservasFiltradas.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <input type="checkbox" checked={seleccionadas.has(r.id)}
                        onChange={() => toggleSeleccion(r.id)}
                        className="w-4 h-4 accent-azul cursor-pointer" />
                    </td>
                    <td className="px-5 py-3 text-xs font-mono text-gray-400">
                      #{r.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-heading font-bold text-azul">{r.comprador?.nombre}</p>
                      <p className="text-xs text-gray-700">{r.comprador?.email}</p>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell text-sm font-heading font-bold text-gray-900">
                      {r.obraNombre || '—'}
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {r.asientos?.slice(0, 3).map(s => (
                          <span key={s} className="badge bg-gray-100 text-gray-600 text-xs">{s}</span>
                        ))}
                        {r.asientos?.length > 3 && <span className="text-xs text-gray-400">+{r.asientos.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-heading font-bold text-gray-900">${r.total}</td>
                    <td className="px-5 py-3 text-center hidden sm:table-cell">
                      <span className="text-xs font-heading font-bold text-gray-700 capitalize">
                        {r.metodoPago?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={clsx('badge',
                        r.estado === 'pendiente'  ? 'badge-pending' :
                        r.estado === 'confirmada' ? 'badge-confirmed' : 'badge-cancelled'
                      )}>{r.estado}</span>
                    </td>
                    <td className="px-5 py-3 text-center hidden lg:table-cell text-xs text-gray-400">
                      {r.creadoEn && format(r.creadoEn.toDate?.() || new Date(), 'dd/MM/yy')}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button onClick={() => setReservaModal(r)}
                        className="p-2 hover:bg-azul/10 hover:text-azul rounded-lg transition-colors text-gray-400"
                        title="Ver detalle">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reservaModal && (
        <ReservaModal
          reserva={reservaModal}
          onClose={() => setReservaModal(null)}
          onConfirmar={confirmarReserva}
          onRechazar={rechazarReserva}
        />
      )}
    </div>
  );
}
