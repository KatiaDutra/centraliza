/* ==========================================================
   INTERFACE
   Funções que transformam dados em HTML na tela.
   Todo texto que veio do usuário passa por escaparHtml().
   ========================================================== */

import { STATUS, ORDEM_STATUS, PRIORIDADES, DIAS_PARA_ALERTA, CLIENTES_NO_RELATORIO } from './config.js';
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

export function renderizarRelatorio(relatorio, periodo, { todosClientes = false } = {}) {
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

  renderizarPorCliente(relatorio.porCliente, todosClientes);
  renderizarGrafico(relatorio.diasDoGrafico);
  document.getElementById('rel-exportar').disabled = vazio;

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

/** Tabela "Por cliente": os que mais abriram atendimentos, ou todos. */
function renderizarPorCliente(clientes, todos) {
  const quantidade = clientes.length;
  const nota = document.getElementById('rel-clientes-nota');
  const botao = document.getElementById('rel-clientes-todos');
  const corpo = document.getElementById('rel-cliente');

  if (quantidade === 0) {
    nota.textContent = '';
    botao.hidden = true;
    corpo.innerHTML = linhaVazia(5);
    return;
  }

  const recorrentes = clientes.filter((cliente) => cliente.total > 1).length;
  nota.textContent = `${quantidade === 1 ? '1 cliente abriu' : `${quantidade} clientes abriram`} atendimentos no período`
    + (recorrentes ? `; ${recorrentes === 1 ? '1 voltou' : `${recorrentes} voltaram`} mais de uma vez.` : '.');

  // O botão só aparece quando há mais clientes do que o limite
  const cortar = quantidade > CLIENTES_NO_RELATORIO;
  botao.hidden = !cortar;
  botao.textContent = todos ? 'Mostrar só os principais' : `Ver todos os ${quantidade} clientes`;
  botao.setAttribute('aria-expanded', String(todos));

  const visiveis = todos || !cortar ? clientes : clientes.slice(0, CLIENTES_NO_RELATORIO);

  corpo.innerHTML = visiveis.map((cliente) => `
    <tr>
      <th scope="row">
        ${escaparHtml(cliente.nome)}
        ${cliente.telefone ? `<span class="tabela-relatorio__detalhe">${escaparHtml(cliente.telefone)}</span>` : ''}
      </th>
      <td>${cliente.total}</td>
      <td>${cliente.pendentes}</td>
      <td>${cliente.resolvidos}</td>
      <td><time datetime="${cliente.ultimo}">${formatarData(cliente.ultimo)}</time></td>
    </tr>`).join('');
}

/* ---------- Gráfico por dia (SVG desenhado à mão) ---------- */

/**
 * Topo do eixo: 4 linhas de grade com números redondos.
 * O passo de cada linha é 1, 2 ou 5 vezes uma potência de 10.
 * Maior valor 7 → passo 2 → topo 8. Maior valor 13 → passo 5 → topo 20.
 */
function topoDoEixo(maior) {
  const minimo = maior / 4;
  const potencia = 10 ** Math.floor(Math.log10(minimo));
  const passo = [1, 2, 5, 10].map((p) => p * potencia).find((p) => p >= minimo);
  return Math.max(1, passo) * 4;
}

/*
 * O gráfico é desenhado na largura real do bloco, para o texto não esticar.
 * Quando a tela Relatórios está escondida, a largura é zero; o ResizeObserver
 * avisa quando o bloco aparece ou muda de tamanho, e aí redesenhamos.
 */
let diasDoGrafico = [];
let larguraDesenhada = 0;

const observador = new ResizeObserver(() => {
  const largura = document.getElementById('rel-grafico').clientWidth;
  if (largura > 0 && largura !== larguraDesenhada) desenharGrafico();
});

function renderizarGrafico(dias) {
  diasDoGrafico = dias;
  observador.observe(document.getElementById('rel-grafico')); // observar de novo não duplica
  desenharGrafico();
}

function desenharGrafico() {
  const container = document.getElementById('rel-grafico');
  const dias = diasDoGrafico;

  // Com um dia só, uma tabela de uma linha já diz tudo
  if (dias.length < 2) {
    container.innerHTML = '';
    return;
  }

  // Medidas em pixels. Cada dia ocupa o que couber, mas nunca menos que 14 px:
  // com muitos dias, o gráfico passa da largura do bloco e rola para o lado.
  larguraDesenhada = container.clientWidth;
  const ESQUERDA = 36; // espaço dos números do eixo
  const DIREITA = 8;
  const TOPO = 12;
  const ALTURA_BARRAS = 160;
  const disponivel = (larguraDesenhada || 600) - ESQUERDA - DIREITA;
  const LARGURA_DIA = Math.max(14, Math.min(60, disponivel / dias.length));
  const BASE = TOPO + ALTURA_BARRAS;
  const largura = ESQUERDA + dias.length * LARGURA_DIA + DIREITA;
  const altura = BASE + 28;

  const maior = Math.max(...dias.map((d) => Math.max(d.abertos, d.resolvidos)));
  const topo = topoDoEixo(Math.max(1, maior));
  const y = (valor) => BASE - (valor / topo) * ALTURA_BARRAS;

  // 4 linhas de grade com o valor ao lado
  const grade = [0, 1, 2, 3, 4].map((i) => {
    const valor = (topo / 4) * i;
    const posicao = y(valor);
    return `
      <line class="grafico__grade" x1="${ESQUERDA}" x2="${largura - 8}" y1="${posicao}" y2="${posicao}"></line>
      <text class="grafico__eixo" x="${ESQUERDA - 8}" y="${posicao + 4}" text-anchor="end">${Number.isInteger(valor) ? valor : valor.toLocaleString('pt-BR')}</text>`;
  }).join('');

  // Mostra a data a cada tantos dias, para os rótulos (uns 40 px cada) não se encostarem
  const intervalo = Math.ceil(44 / LARGURA_DIA);

  const barras = dias.map((dia, indice) => {
    const folga = LARGURA_DIA * 0.2; // espaço entre um dia e outro
    const x = ESQUERDA + indice * LARGURA_DIA + folga / 2;
    const largBarra = (LARGURA_DIA - folga) / 2;
    const [ano, mes, d] = dia.dia.split('-');
    const rotulo = indice % intervalo === 0
      ? `<text class="grafico__eixo" x="${x + largBarra}" y="${BASE + 18}" text-anchor="middle">${d}/${mes}</text>`
      : '';

    return `
      <g>
        <title>${d}/${mes}/${ano}: ${dia.abertos} aberto(s), ${dia.resolvidos} resolvido(s)</title>
        <rect class="grafico__alvo" x="${x - folga / 2}" y="${TOPO}" width="${LARGURA_DIA}" height="${ALTURA_BARRAS}"></rect>
        <rect class="grafico__barra grafico__barra--abertos" x="${x}" y="${y(dia.abertos)}" width="${largBarra}" height="${BASE - y(dia.abertos)}" rx="2"></rect>
        <rect class="grafico__barra grafico__barra--resolvidos" x="${x + largBarra}" y="${y(dia.resolvidos)}" width="${largBarra}" height="${BASE - y(dia.resolvidos)}" rx="2"></rect>
        ${rotulo}
      </g>`;
  }).join('');

  const totalAbertos = dias.reduce((soma, d) => soma + d.abertos, 0);
  const totalResolvidos = dias.reduce((soma, d) => soma + d.resolvidos, 0);

  container.innerHTML = `
    <ul class="grafico__legenda" aria-hidden="true">
      <li><span class="marcador grafico__barra--abertos"></span>Abertos</li>
      <li><span class="marcador grafico__barra--resolvidos"></span>Resolvidos</li>
    </ul>
    <div class="grafico__rolagem">
      <svg class="grafico" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}"
           role="img" aria-label="Gráfico por dia: ${totalAbertos} abertos e ${totalResolvidos} resolvidos em ${dias.length} dias. Os valores de cada dia estão na tabela abaixo.">
        ${grade}
        ${barras}
      </svg>
    </div>`;
}

