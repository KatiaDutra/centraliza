/* ==========================================================
   REGRAS DOS ATENDIMENTOS
   Estas funções só recebem dados e devolvem dados.
   Não mexem na tela nem no localStorage, por isso dá para
   testar cada uma no console do navegador.
   ========================================================== */

import { STATUS, ORDEM_STATUS, PRIORIDADES, DEPARTAMENTOS, LIMITES } from './config.js';
import { apenasDigitos, formatarTelefone, normalizarTexto, diasDesde } from './utils.js';

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

/* ---------- Status ---------- */

/**
 * Devolve uma CÓPIA do atendimento com o novo status,
 * a data da alteração e um registro a mais no histórico.
 * O original não é alterado.
 */
export function alterarStatus(atendimento, novoStatus, agora = new Date()) {
  if (!STATUS[novoStatus]) {
    throw new Error(`Status desconhecido: ${novoStatus}`);
  }

  const dataAtual = agora.toISOString();

  return {
    ...atendimento, // copia todos os campos...
    status: novoStatus, // ...e substitui estes
    ultimaAtualizacao: dataAtual,
    historico: [...atendimento.historico, { status: novoStatus, data: dataAtual }],
  };
}

/** Dias em espera de um atendimento ainda não encerrado. Encerrado devolve null. */
export function diasEmEspera(atendimento, agora = new Date()) {
  if (STATUS[atendimento.status].final) return null;
  return diasDesde(atendimento.dataAbertura, agora);
}

/* ---------- Exclusão ---------- */

/** Devolve uma nova lista sem o atendimento do id informado. */
export function removerAtendimento(atendimentos, id) {
  return atendimentos.filter((atendimento) => atendimento.id !== id);
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

/* ---------- Pesquisa, ordenação e paginação ---------- */

/**
 * Aplica a pesquisa e os dois filtros ao mesmo tempo.
 * A pesquisa aceita o nome do cliente (sem diferenciar acentos e maiúsculas)
 * ou o número do atendimento, com ou sem "#".
 * Filtro vazio ('') quer dizer "todos".
 */
export function filtrarAtendimentos(atendimentos, { texto = '', departamento = '', status = '' }) {
  const termo = normalizarTexto(texto).replace(/^#/, '');

  return atendimentos.filter((atendimento) => {
    const combinaTexto =
      !termo ||
      normalizarTexto(atendimento.cliente).includes(termo) ||
      String(atendimento.id).includes(termo);

    const combinaDepartamento = !departamento || atendimento.departamento === departamento;
    const combinaStatus = !status || atendimento.status === status;

    return combinaTexto && combinaDepartamento && combinaStatus;
  });
}

/*
 * Funções de comparação para o sort().
 * Cada uma devolve um número negativo se "a" vem antes de "b",
 * positivo se vem depois e zero se empatam.
 */
const comparadores = {
  dataAbertura: (a, b) => a.dataAbertura.localeCompare(b.dataAbertura),
  prioridade: (a, b) => PRIORIDADES[a.prioridade].peso - PRIORIDADES[b.prioridade].peso,
  status: (a, b) => ORDEM_STATUS.indexOf(a.status) - ORDEM_STATUS.indexOf(b.status),
};

/**
 * Devolve uma cópia ordenada da lista.
 * direcao 'asc' = crescente, 'desc' = decrescente.
 * Em caso de empate, o atendimento mais recente vem primeiro.
 */
export function ordenarAtendimentos(atendimentos, { campo, direcao }) {
  const comparar = comparadores[campo];
  const sinal = direcao === 'asc' ? 1 : -1;

  // [...lista] faz uma cópia: o sort() não altera a lista original
  return [...atendimentos].sort((a, b) =>
    sinal * comparar(a, b) || b.dataAbertura.localeCompare(a.dataAbertura)
  );
}

/**
 * Corta a lista na página pedida.
 * Se a página pedida não existir (ex.: página 3 de 2), usa a mais próxima válida.
 */
export function paginar(lista, paginaPedida, itensPorPagina) {
  const totalPaginas = Math.max(1, Math.ceil(lista.length / itensPorPagina));
  const pagina = Math.min(Math.max(1, paginaPedida), totalPaginas);
  const inicio = (pagina - 1) * itensPorPagina;

  return {
    itens: lista.slice(inicio, inicio + itensPorPagina),
    pagina,
    totalPaginas,
  };
}

export function obterRecentes(atendimentos, quantidade) {
  return ordenarAtendimentos(atendimentos, { campo: 'dataAbertura', direcao: 'desc' }).slice(0, quantidade);
}
