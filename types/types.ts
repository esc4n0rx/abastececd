// types/types.ts
export interface Posicao {
  codigo: string;
  material: string;
  descricao: string;
  saldoAtual: number;
  demanda: number;
  ud: string;
  deposito: string;
}

export interface RuaData {
  rua: string;
  posicoes: Posicao[];
}

export interface GeneratePdfOptions {
  ruaFilter: string;
  prioridadeFilter: string;
  depositoFilter: string;
  includeAssinaturas: boolean;
  includeStatus: boolean;
  compacto: boolean;
}