/* ==========================================================
   UTILITÁRIOS
   Funções pequenas de texto e data, usadas em vários lugares.
   ========================================================== */

const MILISSEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

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

/**
 * Prepara um texto para comparação: tira acentos e espaços nas pontas
 * e deixa tudo minúsculo. "  João " vira "joao".
 */
export function normalizarTexto(texto) {
  return String(texto)
    .normalize('NFD')                  // separa a letra do acento: "ã" vira "a" + "~"
    .replace(/[\u0300-\u036f]/g, '')   // apaga os acentos soltos
    .toLowerCase()
    .trim();
}

/** Quantos dias completos se passaram desde a data informada. */
export function diasDesde(dataIso, agora = new Date()) {
  const diferenca = agora.getTime() - new Date(dataIso).getTime();
  return Math.max(0, Math.floor(diferenca / MILISSEGUNDOS_POR_DIA));
}

/** 0 → "Aberto hoje", 1 → "Em espera há 1 dia", 5 → "Em espera há 5 dias" */
export function descreverEspera(dias) {
  if (dias === 0) return 'Aberto hoje';
  if (dias === 1) return 'Em espera há 1 dia';
  return `Em espera há ${dias} dias`;
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

/* ---------- Datas dos relatórios ---------- */

/**
 * Dia da data no fuso do navegador, no formato do <input type="date">.
 * "2026-11-05T01:30:00.000Z" vira "2026-11-04" no Brasil (ainda era dia 4 aqui).
 * Como o formato é ano-mês-dia, dá para comparar com < e > como texto.
 */
export function chaveDia(dataIso) {
  const data = new Date(dataIso);
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

/** "2026-11-05" vira "05/11/2026" */
export function formatarChaveDia(chave) {
  const [ano, mes, dia] = chave.split('-');
  return `${dia}/${mes}/${ano}`;
}

/** Duração em milissegundos em texto curto: "35 min", "6 h", "1 dia", "2,5 dias" */
export function descreverDuracao(milissegundos) {
  const minutos = Math.round(milissegundos / 60000);
  if (minutos < 60) return `${Math.max(1, minutos)} min`;

  const horas = Math.round(milissegundos / 3600000);
  if (horas < 24) return `${horas} h`;

  const dias = Math.round((milissegundos / MILISSEGUNDOS_POR_DIA) * 10) / 10; // 1 casa decimal
  return dias === 1 ? '1 dia' : `${dias.toLocaleString('pt-BR')} dias`;
}
