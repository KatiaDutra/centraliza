/* ==========================================================
   CONFIGURAÇÕES
   Listas fixas do sistema, definidas num lugar só.
   Se surgir um departamento novo, é só acrescentar aqui.
   ========================================================== */

export const STATUS = {
  aberto: { rotulo: 'Aberto', final: false },
  'em-andamento': { rotulo: 'Em andamento', final: false },
  aguardando: { rotulo: 'Aguardando cliente', final: false },
  resolvido: { rotulo: 'Resolvido', final: true },
  cancelado: { rotulo: 'Cancelado', final: true },
};

// A ordem em que os status aparecem nas listas
export const ORDEM_STATUS = Object.keys(STATUS);

export const PRIORIDADES = {
  baixa: { rotulo: 'Baixa', peso: 1 },
  media: { rotulo: 'Média', peso: 2 },
  alta: { rotulo: 'Alta', peso: 3 },
};

export const DEPARTAMENTOS = ['Vendas', 'Suporte', 'Financeiro', 'Entregas'];

export const QUANTIDADE_RECENTES = 5;

// Limites de tamanho dos campos do formulário
export const LIMITES = {
  nomeMinimo: 3,
  assunto: 80,
  descricao: 500,
};

// Opções do "Ordenar por". A chave é o value do <option> no HTML.
export const ORDENACOES = {
  recentes: { campo: 'dataAbertura', direcao: 'desc' },
  antigos: { campo: 'dataAbertura', direcao: 'asc' },
  prioridade: { campo: 'prioridade', direcao: 'desc' },
  status: { campo: 'status', direcao: 'asc' },
};

export const ITENS_POR_PAGINA = 10;

// A partir de quantos dias em espera o atendimento ganha destaque na lista
export const DIAS_PARA_ALERTA = 5;
