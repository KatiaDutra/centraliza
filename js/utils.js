/* ==========================================================
   UTILITÁRIOS
   Funções pequenas de texto e data, usadas em vários lugares.
   ========================================================== */

const formatoData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const formatoDataHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** "2026-11-04T09:31:00.000Z" vira "04/11/2026" */
export function formatarData(dataIso) {
  return formatoData.format(new Date(dataIso));
}

/** "2026-11-04T09:31:00.000Z" vira "04/11/2026 às 09:31" */
export function formatarDataHora(dataIso) {
  return formatoDataHora.format(new Date(dataIso)).replace(',', ' às');
}

/** Tira tudo o que não for número: "(11) 98765-4321" vira "11987654321" */
export function apenasDigitos(texto) {
  return String(texto).replace(/\D/g, '');
}

/**
 * Máscara de telefone aplicada enquanto a pessoa digita.
 * 10 dígitos: (00) 0000-0000   |   11 dígitos: (00) 00000-0000
 */
export function formatarTelefone(valor) {
  const digitos = apenasDigitos(valor).slice(0, 11); // no máximo 11 números
  const ddd = digitos.slice(0, 2);

  if (digitos.length === 0) return '';
  if (digitos.length <= 2) return `(${ddd}`;
  if (digitos.length <= 6) return `(${ddd}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) return `(${ddd}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  return `(${ddd}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

/**
 * Troca os caracteres especiais do HTML por códigos seguros.
 * Assim, se alguém digitar <script> no nome, aparece como texto
 * e não é executado pelo navegador.
 */
export function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
