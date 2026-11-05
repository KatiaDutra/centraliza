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
