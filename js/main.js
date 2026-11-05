/* ==========================================================
   PONTO DE ENTRADA
   Guarda os dados em memória, liga a navegação e manda
   desenhar as telas. As regras ficam em atendimentos.js
   e o desenho em ui.js.
   ========================================================== */

import { QUANTIDADE_RECENTES } from './config.js';
import { carregarAtendimentos, salvarAtendimentos } from './storage.js';
import { gerarAtendimentosExemplo } from './exemplos.js';
import { filtrarRegistrosValidos, calcularIndicadores, ordenarPorMaisRecente, obterRecentes } from './atendimentos.js';
import { renderizarIndicadores, renderizarRecentes, renderizarLista } from './ui.js';

/* ---------- Estado: os dados que a aplicação está usando ---------- */

const estado = {
  atendimentos: [],
};

/* ---------- Dados ---------- */

function carregarDados() {
  const { atendimentos, situacao } = carregarAtendimentos();

  // Primeiro acesso: começa com os exemplos e já salva
  if (situacao === 'vazio') {
    estado.atendimentos = gerarAtendimentosExemplo();
    salvarAtendimentos(estado.atendimentos);
    return;
  }

  estado.atendimentos = filtrarRegistrosValidos(atendimentos);

  // Por enquanto só avisamos no console; no passo 10 isso vira um aviso na tela
  if (situacao === 'corrompido') {
    console.warn('Os dados salvos estavam ilegíveis e foram ignorados.');
  } else if (situacao === 'indisponivel') {
    console.warn('O navegador bloqueou o localStorage. Os dados não serão salvos.');
  }
}

/* ---------- Desenho das telas ---------- */

function atualizarTela() {
  const { atendimentos } = estado;

  renderizarIndicadores(calcularIndicadores(atendimentos));
  renderizarRecentes(document.getElementById('lista-recentes'), obterRecentes(atendimentos, QUANTIDADE_RECENTES));
  renderizarLista(document.getElementById('lista-atendimentos'), ordenarPorMaisRecente(atendimentos));

  const total = atendimentos.length;
  document.getElementById('contagem').textContent =
    total === 1 ? '1 atendimento encontrado' : `${total} atendimentos encontrados`;
}

/* ---------- Navegação entre as telas (passo 5) ---------- */

const ROTAS = {
  inicio: 'Início',
  atendimentos: 'Atendimentos',
  novo: 'Novo atendimento',
};

const titulo = document.querySelector('.topo__titulo');
const conteudo = document.getElementById('conteudo');
const telas = document.querySelectorAll('[data-tela]');
const linksMenu = document.querySelectorAll('.menu a');

function rotaAtual() {
  const rota = window.location.hash.slice(1);
  return ROTAS[rota] ? rota : 'inicio';
}

function mostrarTela() {
  const rota = rotaAtual();

  telas.forEach((tela) => {
    tela.hidden = tela.dataset.tela !== rota;
  });

  linksMenu.forEach((link) => {
    if (link.getAttribute('href') === `#${rota}`) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  titulo.textContent = ROTAS[rota];
  document.title = `${ROTAS[rota]} | Centraliza`;
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', () => {
  const destino = window.location.hash.slice(1);
  if (destino && !ROTAS[destino]) return;

  mostrarTela();
  conteudo.focus({ preventScroll: true });
});

/* ---------- Início ---------- */

carregarDados();
atualizarTela();
mostrarTela();
