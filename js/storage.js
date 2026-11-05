/* ==========================================================
   ARMAZENAMENTO
   O único arquivo que conversa com o localStorage.
   Se um dia os dados forem para um servidor, só este arquivo muda.
   ========================================================== */

const CHAVE_ATENDIMENTOS = 'centraliza:atendimentos';
const CHAVE_PROXIMO_ID = 'centraliza:proximo-id';
const ID_INICIAL = 1001;

/**
 * Carrega os atendimentos salvos no navegador.
 * Devolve também a "situacao", para quem chamou decidir o que fazer:
 *   'ok'           → dados carregados
 *   'vazio'        → primeiro acesso, nada salvo ainda
 *   'corrompido'   → havia algo salvo, mas ilegível
 *   'indisponivel' → o navegador bloqueou o localStorage
 */
export function carregarAtendimentos() {
  let conteudo;

  try {
    conteudo = localStorage.getItem(CHAVE_ATENDIMENTOS);
  } catch (erro) {
    return { atendimentos: [], situacao: 'indisponivel' };
  }

  if (conteudo === null) {
    return { atendimentos: [], situacao: 'vazio' };
  }

  try {
    const dados = JSON.parse(conteudo); // texto → lista de objetos
    if (!Array.isArray(dados)) throw new Error('Formato inválido');
    return { atendimentos: dados, situacao: 'ok' };
  } catch (erro) {
    return { atendimentos: [], situacao: 'corrompido' };
  }
}

/** Salva a lista inteira. Devolve true se deu certo. */
export function salvarAtendimentos(atendimentos) {
  try {
    localStorage.setItem(CHAVE_ATENDIMENTOS, JSON.stringify(atendimentos)); // lista → texto
    return true;
  } catch (erro) {
    return false;
  }
}

/**
 * Reserva o próximo número de atendimento e já guarda o seguinte.
 * Usa o maior valor entre o contador salvo e os números que já existem,
 * para nunca repetir um número.
 */
export function reservarProximoId(atendimentos) {
  let contadorSalvo = 0;
  try {
    contadorSalvo = Number(localStorage.getItem(CHAVE_PROXIMO_ID)) || 0;
  } catch (erro) {
    contadorSalvo = 0;
  }

  const maiorExistente = atendimentos.reduce((maior, atendimento) => Math.max(maior, atendimento.id), 0);
  const id = Math.max(contadorSalvo, maiorExistente + 1, ID_INICIAL);

  try {
    localStorage.setItem(CHAVE_PROXIMO_ID, String(id + 1));
  } catch (erro) {
    // Sem localStorage, o número continua certo nesta sessão pelo maiorExistente
  }

  return id;
}
