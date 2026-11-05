/* ==========================================================
   INTERFACE
   Funções que transformam dados em HTML na tela.
   Todo texto que veio do usuário passa por escaparHtml().
   ========================================================== */

import { STATUS, ORDEM_STATUS, PRIORIDADES } from './config.js';
import { escaparHtml, formatarData } from './utils.js';

/* ---------- Peças pequenas ---------- */

function seloStatus(status) {
  return `<span class="status status--${status}">${STATUS[status].rotulo}</span>`;
}

function seloPrioridade(prioridade) {
  return `<span class="prioridade prioridade--${prioridade}">${PRIORIDADES[prioridade].rotulo}</span>`;
}

/** O seletor de status de uma linha, com o status atual já marcado. */
function seletorStatus(atendimento) {
  const opcoes = ORDEM_STATUS.map((status) => {
    const marcado = status === atendimento.status ? ' selected' : '';
    return `<option value="${status}"${marcado}>${STATUS[status].rotulo}</option>`;
  }).join('');

  return `
    <select class="status-select status--${atendimento.status}"
            data-id="${atendimento.id}"
            aria-label="Status do atendimento #${atendimento.id}">
      ${opcoes}
    </select>`;
}

/* ---------- Indicadores e barra de distribuição ---------- */

export function renderizarIndicadores(contagem) {
  document.getElementById('ind-total').textContent = contagem.total;
  document.getElementById('ind-aberto').textContent = contagem.aberto;
  document.getElementById('ind-andamento').textContent = contagem['em-andamento'];
  document.getElementById('ind-resolvido').textContent = contagem.resolvido;

  const barra = document.getElementById('distribuicao-barra');
  const legenda = document.getElementById('distribuicao-legenda');

  // Um pedaço da barra para cada status que tenha pelo menos 1 atendimento
  barra.innerHTML = ORDEM_STATUS
    .filter((status) => contagem[status] > 0)
    .map((status) => `<span class="cor--${status}" style="flex-grow: ${contagem[status]}"></span>`)
    .join('');

  // Texto alternativo da barra, para leitores de tela
  const resumo = ORDEM_STATUS.map((status) => `${STATUS[status].rotulo} ${contagem[status]}`).join(', ');
  barra.setAttribute('aria-label', `Distribuição por status: ${resumo}`);

  legenda.innerHTML = ORDEM_STATUS.map((status) => `
    <li><span class="marcador cor--${status}"></span>${STATUS[status].rotulo} <strong>${contagem[status]}</strong></li>
  `).join('');
}

/* ---------- Tabelas ---------- */

/** Mensagem exibida quando não há nada para listar. */
function estadoVazio(container) {
  container.innerHTML = `
    <div class="vazio">
      <p class="vazio__titulo">Nenhum atendimento registrado ainda</p>
      <p>Registre a primeira solicitação de um cliente para começar.</p>
      <a class="botao botao--primario" href="#novo">Registrar atendimento</a>
    </div>`;
}

/** Tabela resumida da tela Início: status como selo, sem seletor. */
export function renderizarRecentes(container, atendimentos) {
  if (atendimentos.length === 0) {
    estadoVazio(container);
    return;
  }

  const linhas = atendimentos.map((atendimento) => `
    <tr>
      <td class="col-numero" data-rotulo="Nº">#${atendimento.id}</td>
      <td class="col-cliente" data-rotulo="Cliente">${escaparHtml(atendimento.cliente)}</td>
      <td class="col-assunto" data-rotulo="Assunto">${escaparHtml(atendimento.assunto)}</td>
      <td data-rotulo="Departamento">${escaparHtml(atendimento.departamento)}</td>
      <td class="col-status" data-rotulo="Status">${seloStatus(atendimento.status)}</td>
      <td data-rotulo="Abertura"><time datetime="${atendimento.dataAbertura}">${formatarData(atendimento.dataAbertura)}</time></td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="tabela-rolagem">
      <table class="tabela">
        <thead>
          <tr>
            <th scope="col">Nº</th>
            <th scope="col">Cliente</th>
            <th scope="col">Assunto</th>
            <th scope="col">Departamento</th>
            <th scope="col">Status</th>
            <th scope="col">Abertura</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>`;
}

/** Tabela completa da tela Atendimentos. */
export function renderizarLista(container, atendimentos) {
  if (atendimentos.length === 0) {
    estadoVazio(container);
    return;
  }

  const linhas = atendimentos.map((atendimento) => `
    <tr>
      <td class="col-numero" data-rotulo="Nº">#${atendimento.id}</td>
      <td class="col-cliente" data-rotulo="Cliente">${escaparHtml(atendimento.cliente)}</td>
      <td class="col-assunto" data-rotulo="Assunto">${escaparHtml(atendimento.assunto)}</td>
      <td data-rotulo="Departamento">${escaparHtml(atendimento.departamento)}</td>
      <td data-rotulo="Prioridade">${seloPrioridade(atendimento.prioridade)}</td>
      <td data-rotulo="Abertura"><time datetime="${atendimento.dataAbertura}">${formatarData(atendimento.dataAbertura)}</time></td>
      <td class="col-status" data-rotulo="Status">${seletorStatus(atendimento)}</td>
      <td class="col-acoes">
        <button type="button" class="botao botao--texto" data-acao="detalhes" data-id="${atendimento.id}">
          Ver detalhes<span class="visualmente-oculto"> do atendimento #${atendimento.id}</span>
        </button>
      </td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="tabela-rolagem">
      <table class="tabela">
        <thead>
          <tr>
            <th scope="col">Nº</th>
            <th scope="col">Cliente</th>
            <th scope="col">Assunto</th>
            <th scope="col">Departamento</th>
            <th scope="col">Prioridade</th>
            <th scope="col">Abertura</th>
            <th scope="col">Status</th>
            <th scope="col"><span class="visualmente-oculto">Ações</span></th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>`;
}
