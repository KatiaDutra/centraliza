/* ==========================================================
   REGRAS DOS ATENDIMENTOS
   Estas funções só recebem dados e devolvem dados.
   Não mexem na tela nem no localStorage, por isso dá para
   testar cada uma no console do navegador.
   ========================================================== */

import { STATUS, ORDEM_STATUS, PRIORIDADES, DEPARTAMENTOS, LIMITES } from './config.js';
import { apenasDigitos, formatarTelefone } from './utils.js';

/* ---------- Validação e criação ---------- */

/**
 * Confere os dados do formulário.
 * Devolve um objeto com uma mensagem por campo com problema.
 * Objeto vazio ({}) significa que está tudo certo.
 */
export function validarAtendimento(dados) {
  const erros = {};
  const nome = dados.cliente.trim();
  const telefone = apenasDigitos(dados.telefone);
  const assunto = dados.assunto.trim();
  const descricao = dados.descricao.trim();

  if (!nome) {
    erros.cliente = 'Informe o nome do cliente.';
  } else if (nome.length < LIMITES.nomeMinimo) {
    erros.cliente = `O nome precisa ter pelo menos ${LIMITES.nomeMinimo} letras.`;
  }

  if (!telefone) {
    erros.telefone = 'Informe o telefone do cliente.';
  } else if (telefone.length < 10 || telefone.length > 11) {
    erros.telefone = 'Digite o telefone com DDD, por exemplo (11) 98765-4321.';
  }

  if (!DEPARTAMENTOS.includes(dados.departamento)) {
    erros.departamento = 'Escolha o departamento responsável.';
  }

  if (!PRIORIDADES[dados.prioridade]) {
    erros.prioridade = 'Escolha a prioridade.';
  }

  if (!assunto) {
    erros.assunto = 'Informe o assunto.';
  } else if (assunto.length > LIMITES.assunto) {
    erros.assunto = `O assunto pode ter no máximo ${LIMITES.assunto} caracteres.`;
  }

  if (!descricao) {
    erros.descricao = 'Descreva a solicitação do cliente.';
  } else if (descricao.length > LIMITES.descricao) {
    erros.descricao = `A descrição pode ter no máximo ${LIMITES.descricao} caracteres.`;
  }

  return erros;
}

/**
 * Monta um atendimento novo a partir dos dados do formulário.
 * Todo atendimento começa como "aberto", com a data de agora.
 */
export function criarAtendimento(dados, id, agora = new Date()) {
  const dataAtual = agora.toISOString();

  return {
    id,
    cliente: dados.cliente.trim(),
    telefone: formatarTelefone(dados.telefone),
    departamento: dados.departamento,
    prioridade: dados.prioridade,
    assunto: dados.assunto.trim(),
    descricao: dados.descricao.trim(),
    status: 'aberto',
    dataAbertura: dataAtual,
    ultimaAtualizacao: dataAtual,
    historico: [{ status: 'aberto', data: dataAtual }],
  };
}

/* ---------- Leitura e indicadores ---------- */

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
