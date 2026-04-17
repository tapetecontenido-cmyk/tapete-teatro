// Formatea cédula: 24172120 → 24.172.120
export function formatearCedula(valor) {
  // Solo permite números
  const solo = valor.replace(/\D/g, '');
  // Agrega puntos cada 3 dígitos desde la derecha
  return solo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Limpia cédula para guardar: 24.172.120 → 24172120
export function limpiarCedula(valor) {
  return valor.replace(/\D/g, '');
}

// Formatea teléfono venezolano: 04243685986 → 0424-368-59-86
export function formatearTelefono(valor) {
  const solo = valor.replace(/\D/g, '');
  if (solo.length <= 4) return solo;
  if (solo.length <= 7) return `${solo.slice(0, 4)}-${solo.slice(4)}`;
  if (solo.length <= 9) return `${solo.slice(0, 4)}-${solo.slice(4, 7)}-${solo.slice(7)}`;
  return `${solo.slice(0, 4)}-${solo.slice(4, 7)}-${solo.slice(7, 9)}-${solo.slice(9, 11)}`;
}

// Limpia teléfono para guardar: 0424-368-59-86 → 04243685986
export function limpiarTelefono(valor) {
  return valor.replace(/\D/g, '');
}