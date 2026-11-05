/* ==========================================================
   REGRAS DOS RELATÓRIOS
   Igual ao atendimentos.js: só recebem dados e devolvem dados.
   Nada aqui mexe na tela, então dá para testar no console.
   ========================================================== */

import { STATUS, ORDEM_STATUS, DEPARTAMENTOS, DIAS_PARA_ALERTA } from './config.js';
import { chaveDia, apenasDigitos, normalizarTexto } from './utils.js';
import { diasEmEspera } from './atendimentos.js';

/** Se a pessoa escolher o "De" depois do "Até", troca os dois. */
export function ajustarPeriodo({ inicio = '', fim = '' }) {
  if (inicio && fim && inicio > fim) return { inicio: fim, fim: inicio };
  return { inicio, fim };
}

/** Dia dentro do período? Data vazia quer dizer "sem limite daquele lado". */
function dentroDoPeriodo(dia, { inicio, fim }) {
  return (!inicio || dia >= inicio) && (!fim || dia <= fim);
}

/** Atendimentos ABERTOS dentro do período. */
export function filtrarPorPeriodo(atendimentos, periodo) {
  const ajustado = ajustarPeriodo(periodo);
  return atendimentos.filter((atendimento) => dentroDoPeriodo(chaveDia(atendimento.dataAbertura), ajustado));
}

/**
 * Quando o atendimento foi resolvido, pelo histórico.
 * Se ele foi resolvido, reaberto e resolvido de novo, vale a última vez.
 * Atendimento que não está resolvido devolve null.
 */
export function dataResolucao(atendimento) {
  if (atendimento.status !== 'resolvido') return null;
  const registro = [...atendimento.historico].reverse().find((item) => item.status === 'resolvido');
  return registro ? registro.data : atendimento.ultimaAtualizacao;
}

/** Média, em milissegundos, entre a abertura e a resolução. Sem resolvidos, devolve null. */
function tempoMedioAteResolver(atendimentos) {
  const tempos = [];

  for (const atendimento of atendimentos) {
    const resolvidoEm = dataResolucao(atendimento);
    if (resolvidoEm) {
      tempos.push(new Date(resolvidoEm) - new Date(atendimento.dataAbertura));
    }
  }

  if (tempos.length === 0) return null;
  const soma = tempos.reduce((total, tempo) => total + tempo, 0);
  return soma / tempos.length;
}

/**
 * Monta todos os números da tela Relatórios a partir dos
 * atendimentos já filtrados pelo período.
 */
export function gerarRelatorio(atendimentos, periodo = {}, agora = new Date()) {
  const total = atendimentos.length;
  const contar = (lista, condicao) => lista.filter(condicao).length;

  // Por status: quantidade e fatia do total (0.25 = 25%)
  const porStatus = ORDEM_STATUS.map((status) => {
    const quantidade = contar(atendimentos, (a) => a.status === status);
    return { status, quantidade, percentual: total ? quantidade / total : 0 };
  });

  const resolvidos = contar(atendimentos, (a) => a.status === 'resolvido');

  // Tempo em espera: só os que ainda não foram encerrados
  const espera = [
    { rotulo: 'Menos de 1 dia', quantidade: 0, alerta: false },
    { rotulo: `1 a ${DIAS_PARA_ALERTA - 1} dias`, quantidade: 0, alerta: false },
    { rotulo: `${DIAS_PARA_ALERTA} dias ou mais`, quantidade: 0, alerta: true },
  ];

  for (const atendimento of atendimentos) {
    const dias = diasEmEspera(atendimento, agora);
    if (dias === null) continue; // encerrado: não está esperando

    if (dias === 0) espera[0].quantidade += 1;
    else if (dias < DIAS_PARA_ALERTA) espera[1].quantidade += 1;
    else espera[2].quantidade += 1;
  }

  // Por departamento: todos aparecem, mesmo com zero
  const porDepartamento = DEPARTAMENTOS.map((departamento) => {
    const doDepartamento = atendimentos.filter((a) => a.departamento === departamento);
    return {
      departamento,
      total: doDepartamento.length,
      pendentes: contar(doDepartamento, (a) => !STATUS[a.status].final),
      resolvidos: contar(doDepartamento, (a) => a.status === 'resolvido'),
      tempoMedio: tempoMedioAteResolver(doDepartamento),
    };
  });

  // Por dia: quantos foram abertos e quantos foram resolvidos em cada dia.
  // O Map guarda um contador por dia, na forma "2026-11-05" → { abertos, resolvidos }.
  const ajustado = ajustarPeriodo(periodo);
  const dias = new Map();
  const somarNoDia = (dia, campo) => {
    if (!dentroDoPeriodo(dia, ajustado)) return;
    if (!dias.has(dia)) dias.set(dia, { dia, abertos: 0, resolvidos: 0 });
    dias.get(dia)[campo] += 1;
  };

  for (const atendimento of atendimentos) {
    somarNoDia(chaveDia(atendimento.dataAbertura), 'abertos');
    const resolvidoEm = dataResolucao(atendimento);
    if (resolvidoEm) somarNoDia(chaveDia(resolvidoEm), 'resolvidos');
  }

  const porDia = [...dias.values()].sort((a, b) => a.dia.localeCompare(b.dia));

  const porCliente = agruparPorCliente(atendimentos);

  return {
    total,
    resolvidos,
    taxaResolucao: total ? resolvidos / total : null,
    tempoMedio: tempoMedioAteResolver(atendimentos),
    porStatus,
    espera,
    porDepartamento,
    porDia,
    porCliente,
  };
}

/**
 * Identifica o cliente pelo telefone, só com os números.
 * O nome é digitado livre ("João", "joão santos"...), então não serve para agrupar.
 * Sem telefone (registro antigo), usa o nome normalizado como reserva.
 */
export function chaveCliente(atendimento) {
  const telefone = apenasDigitos(atendimento.telefone ?? '');
  return telefone ? `tel:${telefone}` : `nome:${normalizarTexto(atendimento.cliente)}`;
}

/**
 * Quantos atendimentos cada cliente abriu, quantos estão pendentes
 * e quando foi o último. Quem abriu mais vem primeiro;
 * no empate, quem abriu por último vem antes.
 */
export function agruparPorCliente(atendimentos) {
  const clientes = new Map();

  // Do mais antigo para o mais recente: assim o nome e o telefone
  // que ficam guardados são os do atendimento mais novo
  const emOrdem = [...atendimentos].sort((a, b) => a.dataAbertura.localeCompare(b.dataAbertura));

  for (const atendimento of emOrdem) {
    const chave = chaveCliente(atendimento);

    if (!clientes.has(chave)) {
      clientes.set(chave, { chave, total: 0, pendentes: 0, resolvidos: 0 });
    }

    const cliente = clientes.get(chave);
    cliente.nome = atendimento.cliente;
    cliente.telefone = atendimento.telefone ?? '';
    cliente.ultimo = atendimento.dataAbertura;
    cliente.total += 1;
    if (!STATUS[atendimento.status].final) cliente.pendentes += 1;
    if (atendimento.status === 'resolvido') cliente.resolvidos += 1;
  }

  return [...clientes.values()].sort((a, b) =>
    b.total - a.total || b.ultimo.localeCompare(a.ultimo)
  );
}
