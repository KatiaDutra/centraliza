/**
 * Atendimentos de exemplo, carregados apenas no primeiro acesso,
 * para que a aplicação não comece vazia na demonstração.
 * As datas são calculadas a partir do dia atual.
 */

const EXEMPLOS = [
  {
    cliente: 'Carlos Pereira', telefone: '(21) 99812-3344', departamento: 'Financeiro', prioridade: 'media',
    assunto: 'Cobrança em duplicidade no cartão',
    descricao: 'A compra do dia 12 aparece duas vezes na fatura. O cliente enviou a foto do extrato pelo WhatsApp.',
    diasAtras: 18, hora: 10, historico: ['aberto', 'em-andamento', 'resolvido'],
  },
  {
    cliente: 'Ana Costa', telefone: '(47) 98877-1020', departamento: 'Vendas', prioridade: 'baixa',
    assunto: 'Orçamento de salgados para aniversário',
    descricao: 'Quer orçamento de salgados e refrigerantes para 40 pessoas. Prefere receber o retorno por mensagem.',
    diasAtras: 16, hora: 15, historico: ['aberto', 'aguardando', 'resolvido'],
  },
  {
    cliente: 'João Santos', telefone: '(11) 97654-0098', departamento: 'Entregas', prioridade: 'alta',
    assunto: 'Pedido entregue no endereço errado',
    descricao: 'A entrega de sexta foi deixada no prédio vizinho. O cliente pede nova entrega ou o estorno do valor.',
    diasAtras: 14, hora: 9, historico: ['aberto', 'em-andamento', 'resolvido'],
  },
  {
    cliente: 'Fernanda Lima', telefone: '(51) 99123-7788', departamento: 'Suporte', prioridade: 'media',
    assunto: 'Iogurtes com validade vencida',
    descricao: 'Comprou seis iogurtes e dois estavam vencidos. Quer a troca ou a devolução do valor. Ficou de trazer a nota.',
    diasAtras: 12, hora: 11, historico: ['aberto', 'aguardando'],
  },
  {
    cliente: 'Roberto Almeida', telefone: '(11) 3344-5566', departamento: 'Vendas', prioridade: 'baixa',
    assunto: 'Aviso de chegada do café em grãos',
    descricao: 'Pediu para ser avisado quando o café em grãos de 1 kg voltar ao estoque. Desistiu depois de comprar em outro lugar.',
    diasAtras: 10, hora: 17, historico: ['aberto', 'cancelado'],
  },
  {
    cliente: 'Juliana Rocha', telefone: '(21) 98001-2233', departamento: 'Financeiro', prioridade: 'alta',
    assunto: 'Nota fiscal não enviada',
    descricao: 'Precisa da nota fiscal da compra do fim do mês para o reembolso da empresa. Já pediu duas vezes.',
    diasAtras: 8, hora: 14, historico: ['aberto'],
  },
  {
    cliente: 'Paulo Mendes', telefone: '(47) 99654-3210', departamento: 'Entregas', prioridade: 'media',
    assunto: 'Atraso na entrega agendada',
    descricao: 'A entrega estava marcada para a manhã e não chegou até as 14h. O cliente aguarda a posição do entregador.',
    diasAtras: 6, hora: 14, historico: ['aberto', 'em-andamento'],
  },
  {
    cliente: 'Beatriz Souza', telefone: '(51) 98765-1122', departamento: 'Vendas', prioridade: 'baixa',
    assunto: 'Cesta de café da manhã para presente',
    descricao: 'Quer montar uma cesta de café da manhã para domingo. Ainda vai escolher os itens e mandar a lista.',
    diasAtras: 5, hora: 16, historico: ['aberto', 'aguardando'],
  },
  {
    cliente: 'Marcos Oliveira', telefone: '(11) 99900-8877', departamento: 'Vendas', prioridade: 'media',
    assunto: 'Desconto para compra em quantidade',
    descricao: 'Interessado em 20 fardos de água mineral para um evento. Pergunta se há preço especial e prazo de entrega.',
    diasAtras: 4, hora: 10, historico: ['aberto', 'em-andamento'],
  },
  {
    cliente: 'Luciana Ferreira', telefone: '(21) 3222-1100', departamento: 'Financeiro', prioridade: 'media',
    assunto: 'Segunda via do boleto mensal',
    descricao: 'O boleto das compras de outubro não chegou por e-mail. Pede a segunda via com nova data de vencimento.',
    diasAtras: 3, hora: 9, historico: ['aberto', 'resolvido'],
  },
  {
    cliente: 'Ricardo Gomes', telefone: '(47) 98444-5566', departamento: 'Suporte', prioridade: 'alta',
    assunto: 'Troco errado na compra de ontem',
    descricao: 'O cliente percebeu em casa que recebeu R$ 20 a menos de troco. Conferir o fechamento do caixa 2.',
    diasAtras: 2, hora: 18, historico: ['aberto'],
  },
  {
    cliente: 'Camila Martins', telefone: '(11) 97777-3030', departamento: 'Entregas', prioridade: 'baixa',
    assunto: 'Mudança de endereço de entrega',
    descricao: 'Pede que o pedido de amanhã seja entregue no trabalho, e não em casa. Mandou o endereço por mensagem.',
    diasAtras: 1, hora: 11, historico: ['aberto', 'em-andamento'],
  },
  {
    cliente: 'Eduardo Ribeiro', telefone: '(51) 99555-4040', departamento: 'Vendas', prioridade: 'media',
    assunto: 'Encomenda de bolo sem lactose',
    descricao: 'Quer saber se é possível encomendar um bolo sem lactose para sábado, para 15 pessoas.',
    diasAtras: 0, hora: 8, historico: ['aberto'],
  },
  {
    cliente: 'Maria Silva', telefone: '(11) 98765-4321', departamento: 'Suporte', prioridade: 'alta',
    assunto: 'Pacote de arroz rasgado',
    descricao: 'O pacote de arroz de 5 kg veio rasgado na entrega. A cliente quer a troca na próxima compra.',
    diasAtras: 0, hora: 9, historico: ['aberto', 'em-andamento'],
  },
];

const MINUTOS = 60 * 1000;

export function gerarAtendimentosExemplo(agora = new Date()) {
  return EXEMPLOS.map((exemplo, indice) => {
    let abertura = new Date(agora);
    abertura.setDate(abertura.getDate() - exemplo.diasAtras);
    abertura.setHours(exemplo.hora, (indice * 7) % 60, 0, 0);

    // Exemplos "de hoje" não podem ficar com horário no futuro.
    if (abertura > agora) {
      abertura = new Date(agora.getTime() - (EXEMPLOS.length - indice) * 25 * MINUTOS);
    }

    const intervalo = (agora - abertura) / (exemplo.historico.length + 1);
    const historico = exemplo.historico.map((status, posicao) => ({
      status,
      data: new Date(abertura.getTime() + posicao * intervalo).toISOString(),
    }));
    const ultimo = historico[historico.length - 1];

    return {
      id: 1001 + indice,
      cliente: exemplo.cliente,
      telefone: exemplo.telefone,
      departamento: exemplo.departamento,
      prioridade: exemplo.prioridade,
      assunto: exemplo.assunto,
      descricao: exemplo.descricao,
      status: ultimo.status,
      dataAbertura: historico[0].data,
      ultimaAtualizacao: ultimo.data,
      historico,
    };
  });
}
