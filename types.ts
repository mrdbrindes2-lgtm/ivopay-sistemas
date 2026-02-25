// types.ts
export type View = 'DASHBOARD' | 'CLIENTES' | 'COBRANCAS' | 'EQUIPAMENTOS' | 'DESPESAS' | 'ROTAS' | 'RELATORIOS' | 'CONFIGURACOES';
export type Theme = 'light' | 'dark';

export type PixKeyType = 'email' | 'cpf' | 'cnpj' | 'celular' | 'aleatoria' | '';

export interface PixConfig {
  keyType: PixKeyType;
  key: string;
  identifier: string;
}

export interface UserProfile {
  id: string;
  email: string;
  createdAt: Date;
  privacyPinHash?: string;
  pixConfig?: PixConfig;
}

export type EquipmentType = 'mesa' | 'jukebox' | 'grua';

export interface Equipment {
  id: string;
  type: EquipmentType;
  numero: string; // ex: "101" ou "A-05"
  relogioNumero?: string; // ex: "M-S99" ou "R-J12"
  relogioAnterior: number;
  
  // Mesa specific
  tipoCobranca?: 'perPlay' | 'monthly';
  mensalidade?: number;
  valorFicha?: number;
  parteFirma?: number;
  parteCliente?: number;

  // Jukebox specific
  porcentagemJukeboxFirma?: number;
  porcentagemJukeboxCliente?: number;

  // Grua de Pelucia specific
  aluguelPercentual?: number; // aluguel %
  aluguelValor?: number; // aluguel R$
  saldo?: number; // saldo R$
  quantidadePelucia?: number; // quantidade de pelucia
  reposicaoPelucia?: number; // reposição pelucia
  recebimentoEspecie?: number; // recebimento via especie
  recebimentoPix?: number; // recebimento pix
}

export interface Customer {
  id: string;
  createdAt: Date;
  name: string;
  cpfRg: string;
  cidade: string;
  endereco: string;
  telefone: string;
  latitude: number | null;
  longitude: number | null;
  equipment: Equipment[];
  linhaNumero: string;
  assinaturaFirma: string;
  assinaturaCliente: string;
  debtAmount: number;
  lastVisitedAt: Date | null;
}

export interface Billing {
  id: string;
  customerId: string;
  customerName: string;
  equipmentType: EquipmentType;
  equipmentId: string;
  equipmentNumero: string;
  relogioAnterior: number;
  relogioAtual: number;
  partidasJogadas: number; // For all: relogioAtual - relogioAnterior
  settledAt: Date;
  
  // Mesa specific
  tipoCobranca?: 'perPlay' | 'monthly';
  partidasDescontadas?: number;
  partidasPagas?: number;
  valorFicha?: number;
  valorBruto?: number;

  // Mesa & Jukebox calculation result
  parteFirma?: number;
  parteCliente?: number;
  
  // Grua specific
  aluguelPercentual?: number;
  aluguelValor?: number;
  saldo?: number;
  quantidadePelucia?: number;
  sobraPelucia?: number;
  reposicaoPelucia?: number;
  recebimentoEspecie?: number;
  recebimentoPix?: number;

  // Universal
  valorTotal: number; // The final value for the company
  paymentMethod: 'pix' | 'dinheiro' | 'debito_negativo' | 'misto' | 'pending_payment';
  valorPagoDinheiro?: number;
  valorPagoPix?: number;
  valorDebitoNegativo?: number;
  valorBonus?: number;
}


export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: 'mesa' | 'jukebox' | 'grua' | 'geral';
}

export interface DebtPayment {
  id: string;
  customerId: string;
  customerName: string;
  amountPaid: number;
  paidAt: Date;
  paymentMethod: 'pix' | 'dinheiro' | 'misto';
  amountPaidDinheiro?: number;
  amountPaidPix?: number;
}

// FIX: Added the missing 'Adesivo' interface as it was not exported from types.ts, causing an error in AdesivosView.tsx.
export interface Adesivo {
  id: string;
  numero: string;
  imageUrl: string;
}

export interface Warning {
  id: string;
  customerId: string;
  customerName: string;
  message: string;
  createdAt: Date;
  isResolved: boolean;
}

export type EquipmentWithCustomer = Equipment & {
  customerName: string;
  customerId: string;
};

export type SavedUser = {
  email: string;
  pass?: string; // base64 encoded password
};

export interface Route {
  id: string;
  name: string;
  customerIds: string[]; // Ordered list
  createdAt: Date;
}