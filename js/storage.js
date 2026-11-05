/* ==========================================================
   ARMAZENAMENTO
   O único arquivo que conversa com o localStorage.
   Se um dia os dados forem para um servidor, só este arquivo muda.
   ========================================================== */

const CHAVE_ATENDIMENTOS = 'centraliza:atendimentos';

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
