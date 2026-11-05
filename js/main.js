/* ==========================================================
   NAVEGAÇÃO ENTRE AS TELAS
   Mostra só a tela indicada no endereço (#inicio, #atendimentos
   ou #novo) e atualiza o menu e os títulos.
   ========================================================== */

// Nome de cada tela, usado no título do topo e na aba do navegador
const ROTAS = {
  inicio: 'Início',
  atendimentos: 'Atendimentos',
  novo: 'Novo atendimento',
};

// Elementos que vamos usar, buscados uma vez só
const titulo = document.querySelector('.topo__titulo');
const conteudo = document.getElementById('conteudo');
const telas = document.querySelectorAll('[data-tela]');
const linksMenu = document.querySelectorAll('.menu a');

/** Lê o endereço e devolve o nome da tela. Se não for uma tela conhecida, volta para o Início. */
function rotaAtual() {
  const rota = window.location.hash.slice(1); // "#novo" vira "novo"
  return ROTAS[rota] ? rota : 'inicio';
}

/** Mostra a tela atual e esconde as outras. */
function mostrarTela() {
  const rota = rotaAtual();

  // Só a tela da rota fica visível
  telas.forEach((tela) => {
    tela.hidden = tela.dataset.tela !== rota;
  });

  // Destaca no menu o link da tela atual
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

// Toda vez que o endereço muda (clique no menu, voltar ou avançar)
window.addEventListener('hashchange', () => {
  const destino = window.location.hash.slice(1);

  // "#conteudo" (link de pular conteúdo) não é uma tela: ignora
  if (destino && !ROTAS[destino]) return;

  mostrarTela();

  // Leva o foco para o conteúdo, para quem usa teclado ou leitor de tela
  conteudo.focus({ preventScroll: true });
});

// Ao abrir a página, mostra a tela certa
mostrarTela();
