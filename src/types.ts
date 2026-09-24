export type EmployeeStatus = "ativo" | "nao_encontrado" | "desligado";
export type BenefitStatus = "com_adesao" | "sem_adesao";
export type OrigemBase = "upload_manual" | "integracao_erp" | "sftp";

export interface Empresa {
  id: string;
  nome: string;
  /** Dia do mês limite para a conferência de CNPJs (configurável por empresa). */
  diaPrazoConferencia: number;
}

export interface Cnpj {
  id: string;
  empresaId: string;
  cnpj: string;
  razaoSocial: string;
  ativo: boolean;
}

export interface Usuario {
  id: string;
  empresaId: string;
  nome: string;
  email: string;
  cargo: string;
}

export interface Employee {
  id: string;
  empresaId: string;
  nome: string;
  email: string;
  matricula: string;
  /** CNPJ atual (mesmo formato do cadastro de CNPJs). Vazio = sem CNPJ definido. */
  cnpj: string;
  departamento: string;
  cargo: string;
  status: EmployeeStatus;
  beneficio: BenefitStatus;
  dataEntrada: string;
  dataAtualizacao: string;
  dataDesligamento?: string;
}

export type FieldChange = {
  campo: string;
  anterior: string;
  novo: string;
  /** Mudanças que afetam o faturamento (ex.: CNPJ) ganham destaque na tela. */
  destaque?: boolean;
};

export interface EmployeeDiffChanged {
  id: string;
  nome: string;
  matricula: string;
  mudancas: FieldChange[];
}

export interface VersionDiff {
  novos: Employee[];
  naoEncontrados: Employee[];
  alterados: EmployeeDiffChanged[];
}

export interface ValidationErrorRow {
  linha: number;
  colaborador: string;
  campo: string;
  problema: string;
}

export interface ValidationSummary {
  totalRegistros: number;
  registrosValidos: number;
  erros: number;
  duplicados: number;
  emailsInvalidos: number;
  camposObrigatoriosAusentes: number;
  cnpjsNaoCadastrados: number;
  errosDetalhados: ValidationErrorRow[];
  temErroCritico: boolean;
}

export type UploadStatus = "validado" | "com_erros" | "confirmada" | "cancelada";

export interface Upload {
  id: string;
  empresaId: string;
  arquivo: string;
  tamanho: number;
  data: string;
  usuario: string;
  origem: OrigemBase;
  status: UploadStatus;
  validation: ValidationSummary;
  total: number;
  novos: number;
  naoEncontrados: number;
  alterados: number;
  diff: VersionDiff;
  versaoId?: string;
}

/** Versão imutável da base, criada a cada atualização confirmada. */
export interface BaseVersion {
  id: string;
  empresaId: string;
  numero: number;
  data: string;
  usuario: string;
  arquivo: string;
  origem: OrigemBase;
  uploadId: string;
  total: number;
  colaboradores: Employee[];
}

export type ConferenciaStatus = "pendente" | "em_conferencia" | "confirmada";

export interface VinculoCnpj {
  employeeId: string;
  nome: string;
  matricula: string;
  cnpj: string;
}

export interface ConferenciaCnpj {
  id: string;
  empresaId: string;
  /** Competência no formato AAAA-MM. */
  competencia: string;
  prazo: string;
  status: ConferenciaStatus;
  confirmadoPor?: string;
  confirmadoEm?: string;
  /** Vínculos colaborador ↔ CNPJ congelados no momento da confirmação. */
  vinculos?: VinculoCnpj[];
}

export type AuditAction =
  | "upload_iniciado"
  | "upload_concluido"
  | "upload_cancelado"
  | "atualizacao_confirmada"
  | "colaborador_entrou_na_base"
  | "colaborador_alterado"
  | "colaborador_nao_encontrado"
  | "colaborador_desligado"
  | "cnpj_alterado"
  | "cnpj_alterado_em_massa"
  | "conferencia_confirmada"
  | "exportacao";

export type AuditEntity = "colaborador" | "upload" | "conferencia" | "exportacao";

export interface AuditEvent {
  id: string;
  empresaId: string;
  usuario: string;
  data: string;
  acao: AuditAction;
  entidadeTipo: AuditEntity;
  entidadeId: string;
  entidadeNome: string;
  valorAnterior?: string;
  valorNovo?: string;
  descricao: string;
}

export interface ParsedRow {
  linha: number;
  nome: string;
  email: string;
  matricula: string;
  cnpj: string;
  departamento: string;
  cargo: string;
  status: string;
}

export interface Database {
  version: number;
  empresas: Empresa[];
  cnpjs: Cnpj[];
  usuarios: Usuario[];
  employees: Employee[];
  uploads: Upload[];
  versions: BaseVersion[];
  conferencias: ConferenciaCnpj[];
  audit: AuditEvent[];
}
