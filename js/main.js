/* ==========================================================
   PONTO DE ENTRADA
   Guarda os dados em memória, liga a navegação e manda
   desenhar as telas. As regras ficam em atendimentos.js
   e o desenho em ui.js.
   ========================================================== */

import { QUANTIDADE_RECENTES, LIMITES } from './config.js';
import { formatarTelefone, formatarDataHora } from './utils.js';
import { carregarAtendimentos, salvarAtendimentos, reservarProximoId } from './storage.js';
import { gerarAtendimentosExemplo } from './exemplos.js';
import {
  validarAtendimento, criarAtendimento,
  filtrarRegistrosValidos, calcularIndicadores, ordenarPorMaisRecente, obterRecentes,
} from './atendimentos.js';
import {
  renderizarIndicadores, renderizarRecentes, renderizarLista,
  mostrarErrosFormulario, mostrarAviso,
} from './ui.js';

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

  if (situacao === 'corrompido') {
    mostrarAviso('Os dados salvos neste navegador estavam ilegíveis e foram ignorados. A lista começou vazia.', 'erro');
  } else if (situacao === 'indisponivel') {
    mostrarAviso('O navegador bloqueou o armazenamento local. Os atendimentos não serão mantidos ao fechar a página.', 'aviso');
  }
}

/** Salva e avisa se o navegador não deixou. */
function persistir() {
  const salvou = salvarAtendimentos(estado.atendimentos);
  if (!salvou) {
    mostrarAviso('Não foi possível salvar no navegador. A alteração vale só até fechar a página.', 'aviso');
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

  if (rota === 'novo') atualizarDataPrevista();
}

window.addEventListener('hashchange', () => {
  const destino = window.location.hash.slice(1);
  if (destino && !ROTAS[destino]) return;

  mostrarTela();
  conteudo.focus({ preventScroll: true });
});

/* ---------- Formulário de cadastro ---------- */

const formulario = document.getElementById('form-atendimento');
const campos = formulario.elements; // acesso aos campos pelo name: campos.cliente, campos.telefone...

/** Junta os valores do formulário num objeto. */
function lerFormulario() {
  return {
    cliente: campos.cliente.value,
    telefone: campos.telefone.value,
    departamento: campos.departamento.value,
    prioridade: campos.prioridade.value, // nos rádios, devolve o valor do marcado
    assunto: campos.assunto.value,
    descricao: campos.descricao.value,
  };
}

function atualizarContadores() {
  document.getElementById('contador-assunto').textContent = `${campos.assunto.value.length}/${LIMITES.assunto}`;
  document.getElementById('contador-descricao').textContent = `${campos.descricao.value.length}/${LIMITES.descricao}`;
}

function atualizarDataPrevista() {
  document.getElementById('data-prevista').textContent = formatarDataHora(new Date().toISOString());
}

/** Coloca o cursor no primeiro campo com erro. */
function focarPrimeiroErro(erros) {
  const ordem = ['cliente', 'telefone', 'departamento', 'prioridade', 'assunto', 'descricao'];
  const primeiro = ordem.find((campo) => erros[campo]);
  if (!primeiro) return;

  if (primeiro === 'prioridade') {
    formulario.querySelector('input[name="prioridade"]').focus();
  } else {
    campos[primeiro].focus();
  }
}

// Máscara: reescreve o telefone formatado a cada tecla
campos.telefone.addEventListener('input', () => {
  campos.telefone.value = formatarTelefone(campos.telefone.value);
});

// Qualquer digitação no formulário
formulario.addEventListener('input', () => {
  atualizarContadores();

  // Depois da primeira tentativa de envio, o erro some assim que o campo é corrigido
  if (formulario.dataset.tentouEnviar) {
    mostrarErrosFormulario(formulario, validarAtendimento(lerFormulario()));
  }
});

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault(); // impede o navegador de recarregar a página

  const dados = lerFormulario();
  const erros = validarAtendimento(dados);
  mostrarErrosFormulario(formulario, erros);

  // Tem erro: marca a tentativa, leva ao campo e avisa
  if (Object.keys(erros).length > 0) {
    formulario.dataset.tentouEnviar = 'true';
    focarPrimeiroErro(erros);
    mostrarAviso('Corrija os campos destacados para registrar o atendimento.', 'erro');
    return;
  }

  // Tudo certo: cria, guarda, salva e redesenha
  const id = reservarProximoId(estado.atendimentos);
  estado.atendimentos = [...estado.atendimentos, criarAtendimento(dados, id)];
  persistir();
  atualizarTela();

  formulario.reset();
  mostrarAviso(`Atendimento #${id} registrado.`);
  campos.cliente.focus();
});

// Botão "Limpar campos" (e o reset depois de salvar)
formulario.addEventListener('reset', () => {
  delete formulario.dataset.tentouEnviar;
  mostrarErrosFormulario(formulario, {});

  // O navegador só limpa os campos depois deste evento, então esperamos um instante
  setTimeout(() => {
    atualizarContadores();
    atualizarDataPrevista();
  });
});

/* ---------- Início ---------- */

carregarDados();
atualizarTela();
mostrarTela();
