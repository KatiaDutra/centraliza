/* ==========================================================
   UTILITÁRIOS
   Funções pequenas de texto e data, usadas em vários lugares.
   ========================================================== */

const formatoData = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/** "2026-11-04T09:31:00.000Z" vira "04/11/2026" */
export function formatarData(dataIso) {
  return formatoData.format(new Date(dataIso));
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
