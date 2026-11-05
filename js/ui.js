/* ==========================================================
   INTERFACE
   Funções que transformam dados em HTML na tela.
   Todo texto que veio do usuário passa por escaparHtml().
   ========================================================== */

import { STATUS, ORDEM_STATUS, PRIORIDADES, DIAS_PARA_ALERTA } from './config.js';
import {
  escaparHtml, formatarData, formatarDataHora, apenasDigitos, descreverEspera,
  formatarChaveDia, descreverDuracao,
} from './utils.js';
import { diasEmEspera } from './atendimentos.js';

/* ---------- Peças pequenas ---------- */

function seloStatus(status) {
  return `<span class="status status--${status}">${STATUS[status].rotulo}</span>`;
}

function seloPrioridade(prioridade) {
  return `<span class="prioridade prioridade--${prioridade}">${PRIORIDADES[prioridade].rotulo}</span>`;
}

/**
 * O seletor de status, com o status atual já marcado.
 * "local" diz onde ele está (lista ou detalhes): ajuda a devolver o foco
 * ao seletor certo depois que a tela é redesenhada.
 */
function seletorStatus(atendimento, local = 'lista', id = '') {
  const opcoes = ORDEM_STATUS.map((status) => {
    const marcado = status === atendimento.status ? ' selected' : '';
    return `<option value="${status}"${marcado}>${STATUS[status].rotulo}</option>`;
  }).join('');

  return `
    <select class="status-select status--${atendimento.status}" ${id ? `id="${id}"` : ''}
            data-id="${atendimento.id}" data-local="${local}"
            aria-label="Status do atendimento #${atendimento.id}">
      ${opcoes}
    </select>`;
}

/** "Em espera há X dias" embaixo da data. Atendimentos encerrados não mostram nada. */
function textoEspera(atendimento) {
  const dias = diasEmEspera(atendimento);
  if (dias === null) return '';

  const classe = dias >= DIAS_PARA_ALERTA ? 'espera espera--alerta' : 'espera';
  return `<span class="${classe}">${descreverEspera(dias)}</span>`;
}

function botaoDetalhes(atendimento) {
  return `
    <button type="button" class="botao botao--texto" data-acao="detalhes" data-id="${atendimento.id}">
      Ver detalhes<span class="visualmente-oculto"> do atendimento #${atendimento.id}</span>
    </button>`;
}

/* ---------- Indicadores e barra de distribuição ---------- */

export function renderizarIndicadores(contagem) {
  document.getElementById('ind-total').textContent = contagem.total;
  document.getElementById('ind-aberto').textContent = contagem.aberto;
  document.getElementById('ind-andamento').textContent = contagem['em-andamento'];
  document.getElementById('ind-resolvido').textContent = contagem.resolvido;
  document.getElementById('ind-aguardando').textContent = contagem.aguardando;
  document.getElementById('ind-cancelado').textContent = contagem.cancelado;

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

/**
 * Mensagem exibida quando não há nada para listar.
 * Com filtros ativos, a orientação é limpar os filtros;
 * sem filtros, é cadastrar o primeiro atendimento.
 */
function estadoVazio(container, temFiltro = false) {
  if (temFiltro) {
    container.innerHTML = `
      <div class="vazio">
        <p class="vazio__titulo">Nenhum atendimento encontrado</p>
        <p>Confira a pesquisa ou limpe os filtros para ver todos os atendimentos.</p>
        <button type="button" class="botao botao--secundario" data-acao="limpar-filtros">Limpar filtros</button>
      </div>`;
    return;
  }

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
      <td class="col-acoes">${botaoDetalhes(atendimento)}</td>
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
            <th scope="col"><span class="visualmente-oculto">Ações</span></th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>`;
}

/** Tabela completa da tela Atendimentos. */
export function renderizarLista(container, atendimentos, temFiltro) {
  if (atendimentos.length === 0) {
    estadoVazio(container, temFiltro);
    return;
  }

  const linhas = atendimentos.map((atendimento) => `
    <tr>
      <td class="col-numero" data-rotulo="Nº">#${atendimento.id}</td>
      <td class="col-cliente" data-rotulo="Cliente">${escaparHtml(atendimento.cliente)}</td>
      <td class="col-assunto" data-rotulo="Assunto">${escaparHtml(atendimento.assunto)}</td>
      <td data-rotulo="Departamento">${escaparHtml(atendimento.departamento)}</td>
      <td data-rotulo="Prioridade">${seloPrioridade(atendimento.prioridade)}</td>
      <td data-rotulo="Abertura">
        <time datetime="${atendimento.dataAbertura}">${formatarData(atendimento.dataAbertura)}</time>
        ${textoEspera(atendimento)}
      </td>
      <td class="col-status" data-rotulo="Status">${seletorStatus(atendimento)}</td>
      <td class="col-acoes">${botaoDetalhes(atendimento)}</td>
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

/* ---------- Detalhes do atendimento ---------- */

/** Link do WhatsApp com o número do cliente e uma mensagem pronta. */
function linkWhatsApp(atendimento) {
  const primeiroNome = atendimento.cliente.split(' ')[0];
  const mensagem = `Olá, ${primeiroNome}! Aqui é da equipe de atendimento, sobre a sua solicitação #${atendimento.id}: ${atendimento.assunto}.`;
  // encodeURIComponent troca espaços e acentos por códigos que podem ir num link
  return `https://wa.me/55${apenasDigitos(atendimento.telefone)}?text=${encodeURIComponent(mensagem)}`;
}

export function renderizarDetalhes(container, atendimento) {
  const dias = diasEmEspera(atendimento);
  const espera = dias === null ? 'Encerrado' : descreverEspera(dias);

  // Histórico do mais novo para o mais antigo
  const historico = [...atendimento.historico].reverse().map((registro) => `
    <li class="status--${registro.status}">
      ${seloStatus(registro.status)}
      <time datetime="${registro.data}">${formatarDataHora(registro.data)}</time>
    </li>
  `).join('');

  container.innerHTML = `
    <header class="detalhes__topo">
      <div>
        <p class="detalhes__numero">Atendimento #${atendimento.id}</p>
        <h2 class="detalhes__titulo" id="detalhes-titulo">${escaparHtml(atendimento.assunto)}</h2>
      </div>
      <button type="button" class="botao botao--secundario" data-fechar-modal>Fechar</button>
    </header>

    <dl class="detalhes__dados">
      <div><dt>Cliente</dt><dd>${escaparHtml(atendimento.cliente)}</dd></div>
      <div><dt>Telefone</dt><dd>${escaparHtml(atendimento.telefone)}</dd></div>
      <div><dt>Departamento</dt><dd>${escaparHtml(atendimento.departamento)}</dd></div>
      <div><dt>Prioridade</dt><dd>${seloPrioridade(atendimento.prioridade)}</dd></div>
      <div><dt>Abertura</dt><dd>${formatarDataHora(atendimento.dataAbertura)}</dd></div>
      <div><dt>Última atualização</dt><dd>${formatarDataHora(atendimento.ultimaAtualizacao)}</dd></div>
      <div><dt>Tempo de espera</dt><dd>${espera}</dd></div>
    </dl>

    <section class="detalhes__secao">
      <h3 class="detalhes__subtitulo">Descrição</h3>
      <p class="detalhes__descricao">${escaparHtml(atendimento.descricao)}</p>
    </section>

    <div class="detalhes__acoes">
      <div class="campo">
        <label for="detalhes-status">Status</label>
        ${seletorStatus(atendimento, 'detalhes', 'detalhes-status')}
      </div>
      <a class="botao botao--whatsapp" href="${linkWhatsApp(atendimento)}" target="_blank" rel="noopener noreferrer">
        Conversar no WhatsApp
      </a>
    </div>

    <section class="detalhes__secao">
      <h3 class="detalhes__subtitulo">Histórico de status</h3>
      <ol class="linha-tempo">${historico}</ol>
    </section>

    <footer class="detalhes__rodape">
      <button type="button" class="botao botao--perigo-contorno" data-acao="excluir" data-id="${atendimento.id}">
        Excluir atendimento
      </button>
    </footer>`;
}

/* ---------- Confirmação ---------- */

/**
 * Abre o modal de confirmação e espera a resposta.
 * Devolve uma Promise: true se a pessoa confirmou, false se voltou ou apertou Esc.
 */
export function confirmar({ titulo, mensagem, textoConfirmar }) {
  const modal = document.getElementById('modal-confirmacao');
  document.getElementById('confirmacao-titulo').textContent = titulo;
  document.getElementById('confirmacao-texto').textContent = mensagem;
  document.getElementById('confirmacao-botao').textContent = textoConfirmar;

  modal.returnValue = '';
  modal.showModal();

  return new Promise((resolver) => {
    // O botão clicado define o returnValue (value="confirmar" ou "voltar")
    modal.addEventListener('close', () => resolver(modal.returnValue === 'confirmar'), { once: true });
  });
}

/* ---------- Paginação ---------- */

export function renderizarPaginacao(container, { pagina, totalPaginas }) {
  // Com uma página só, não há o que paginar
  if (totalPaginas <= 1) {
    container.innerHTML = '';
    return;
  }

  const primeira = pagina === 1 ? 'disabled' : '';
  const ultima = pagina === totalPaginas ? 'disabled' : '';

  container.innerHTML = `
    <button type="button" class="botao botao--secundario" data-pagina="${pagina - 1}" ${primeira}>Anterior</button>
    <p>Página ${pagina} de ${totalPaginas}</p>
    <button type="button" class="botao botao--secundario" data-pagina="${pagina + 1}" ${ultima}>Próxima</button>`;
}

/* ---------- Erros do formulário ---------- */

const CAMPOS_FORMULARIO = ['cliente', 'telefone', 'departamento', 'prioridade', 'assunto', 'descricao'];

/**
 * Mostra a mensagem de cada campo com erro e limpa a dos que estão certos.
 * aria-invalid="true" deixa a borda vermelha (CSS) e avisa o leitor de tela.
 */
export function mostrarErrosFormulario(formulario, erros) {
  for (const campo of CAMPOS_FORMULARIO) {
    // A prioridade é um grupo de rádios: o aviso vai no fieldset inteiro
    const elemento = campo === 'prioridade'
      ? formulario.querySelector('#grupo-prioridade')
      : formulario.elements[campo];
    const mensagem = formulario.querySelector(`#erro-${campo}`);

    if (erros[campo]) {
      elemento.setAttribute('aria-invalid', 'true');
      mensagem.textContent = erros[campo];
    } else {
      elemento.removeAttribute('aria-invalid');
      mensagem.textContent = '';
    }
  }
}

/* ---------- Avisos (toasts) ---------- */

/**
 * Mostra um aviso no canto da tela, que some sozinho.
 * tipo: 'sucesso' | 'erro' | 'aviso'
 */
export function mostrarAviso(mensagem, tipo = 'sucesso') {
  const area = document.getElementById('avisos');

  // Um <dialog> aberto fica por cima de tudo na página. Para o aviso não ficar
  // escondido atrás dele, a área de avisos vai para dentro do modal aberto.
  const modalAberto = document.querySelector('dialog[open]');
  (modalAberto ?? document.body).append(area);

  // Um sucesso torna os avisos de erro anteriores desatualizados: tira da tela
  if (tipo === 'sucesso') {
    area.querySelectorAll('.aviso--erro').forEach((antigo) => antigo.remove());
  }

  const aviso = document.createElement('div');
  aviso.className = `aviso aviso--${tipo}`;
  aviso.innerHTML = '<p></p><button type="button" aria-label="Fechar aviso">&times;</button>';
  aviso.querySelector('p').textContent = mensagem; // textContent: nunca vira HTML

  const remover = () => aviso.remove();
  aviso.querySelector('button').addEventListener('click', remover);
  setTimeout(remover, tipo === 'erro' ? 7000 : 4500); // erros ficam mais tempo

  area.append(aviso);
}

/* ---------- Relatórios ---------- */

const formatoPercentual = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });

/** 0.25 vira "25%". Sem valor, mostra um traço. */
function textoPercentual(valor) {
  return valor === null ? '–' : formatoPercentual.format(valor);
}

function textoDuracao(milissegundos) {
  return milissegundos === null ? '–' : descreverDuracao(milissegundos);
}

/** Linha única avisando que não há dados, ocupando todas as colunas. */
function linhaVazia(colunas, texto = 'Nenhum atendimento no período.') {
  return `<tr><td class="tabela-relatorio__vazio" colspan="${colunas}">${texto}</td></tr>`;
}

/** Texto acima do resumo, dizendo qual período está sendo mostrado. */
function descreverPeriodo({ inicio, fim }, total) {
  const quantidade = total === 1 ? '1 atendimento' : `${total} atendimentos`;
  if (!inicio && !fim) return `Mostrando todo o período: ${quantidade}.`;
  if (inicio && fim) return `De ${formatarChaveDia(inicio)} a ${formatarChaveDia(fim)}: ${quantidade}.`;
  if (inicio) return `A partir de ${formatarChaveDia(inicio)}: ${quantidade}.`;
  return `Até ${formatarChaveDia(fim)}: ${quantidade}.`;
}

export function renderizarRelatorio(relatorio, periodo) {
  const vazio = relatorio.total === 0;

  document.getElementById('rel-descricao').textContent = descreverPeriodo(periodo, relatorio.total);

  // Resumo
  document.getElementById('rel-total').textContent = relatorio.total;
  document.getElementById('rel-resolvidos').textContent = relatorio.resolvidos;
  document.getElementById('rel-taxa').textContent = textoPercentual(relatorio.taxaResolucao);
  document.getElementById('rel-tempo-medio').textContent = textoDuracao(relatorio.tempoMedio);

  // Por status
  document.getElementById('rel-status').innerHTML = vazio
    ? linhaVazia(3)
    : relatorio.porStatus.map((linha) => `
      <tr>
        <th scope="row"><span class="marcador cor--${linha.status}" aria-hidden="true"></span>${STATUS[linha.status].rotulo}</th>
        <td>${linha.quantidade}</td>
        <td>${textoPercentual(linha.percentual)}</td>
      </tr>`).join('');

  // Tempo em espera
  const pendentes = relatorio.espera.reduce((total, faixa) => total + faixa.quantidade, 0);
  document.getElementById('rel-espera').innerHTML = pendentes === 0
    ? linhaVazia(2, 'Nenhum atendimento pendente no período.')
    : relatorio.espera.map((faixa) => `
      <tr class="${faixa.alerta && faixa.quantidade > 0 ? 'linha--alerta' : ''}">
        <th scope="row">${faixa.rotulo}</th>
        <td>${faixa.quantidade}</td>
      </tr>`).join('');

  // Por departamento
  document.getElementById('rel-departamento').innerHTML = vazio
    ? linhaVazia(5)
    : relatorio.porDepartamento.map((linha) => `
      <tr>
        <th scope="row">${escaparHtml(linha.departamento)}</th>
        <td>${linha.total}</td>
        <td>${linha.pendentes}</td>
        <td>${linha.resolvidos}</td>
        <td>${textoDuracao(linha.tempoMedio)}</td>
      </tr>`).join('');

  // Por dia
  document.getElementById('rel-data').innerHTML = relatorio.porDia.length === 0
    ? linhaVazia(3)
    : relatorio.porDia.map((linha) => `
      <tr>
        <th scope="row"><time datetime="${linha.dia}">${formatarChaveDia(linha.dia)}</time></th>
        <td>${linha.abertos}</td>
        <td>${linha.resolvidos}</td>
      </tr>`).join('');
}

