/* ==========================================================
   REGRAS DOS ATENDIMENTOS
   Estas funções só recebem dados e devolvem dados.
   Não mexem na tela nem no localStorage, por isso dá para
   testar cada uma no console do navegador.
   ========================================================== */

import { STATUS, ORDEM_STATUS, PRIORIDADES } from './config.js';

/**
 * Descarta registros salvos que não tenham o formato esperado.
 * Protege a aplicação se alguém mexer no localStorage na mão.
 */
export function filtrarRegistrosValidos(lista) {
  return lista.filter((item) =>
    item !== null &&
    typeof item === 'object' &&
    Number.isInteger(item.id) &&
    typeof item.cliente === 'string' &&
    typeof item.assunto === 'string' &&
    typeof item.dataAbertura === 'string' &&
    Boolean(STATUS[item.status]) &&
    Boolean(PRIORIDADES[item.prioridade])
  );
}

/** Conta quantos atendimentos há no total e em cada status. */
export function calcularIndicadores(atendimentos) {
  const contagem = { total: atendimentos.length };

  // Começa todos os status com zero
  for (const status of ORDEM_STATUS) {
    contagem[status] = 0;
  }

  // Soma 1 no status de cada atendimento
  for (const atendimento of atendimentos) {
    contagem[atendimento.status] += 1;
  }

  return contagem;
}

/** Devolve uma cópia da lista com os mais recentes primeiro. */
export function ordenarPorMaisRecente(atendimentos) {
  // [...lista] faz uma cópia: o sort() não altera a lista original
  return [...atendimentos].sort((a, b) => b.dataAbertura.localeCompare(a.dataAbertura));
}

export function obterRecentes(atendimentos, quantidade) {
  return ordenarPorMaisRecente(atendimentos).slice(0, quantidade);
}
