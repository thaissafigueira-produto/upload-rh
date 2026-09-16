export type EmployeeStatus = "ativo" | "desligado";
export type BenefitStatus = "com_adesao" | "sem_adesao";
export type Department =
  | "Tecnologia"
  | "RH"
  | "Financeiro"
  | "Comercial"
  | "Marketing"
  | "Operações";

export interface Cnpj {
  cnpj: string;
  razaoSocial: string;
}

export interface Employee {
  id: string;
  nome: string;
  email: string;
  matricula: string;
  cnpj: string;
  departamento: Department;
  cargo: string;
  status: EmployeeStatus;
  beneficio: BenefitStatus;
  dataEntrada: string; // ISO date
  dataAtualizacao: string; // ISO date
  naoEncontradoNaUltimaBase?: boolean;
}

export type FieldChange = {
  campo: string;
  anterior: string;
  novo: string;
};

export interface EmployeeDiffChanged {
  id: string;
  nome: string;
  matricula: string;
  mudancas: FieldChange[];
}

export interface VersionDiff {
  novos: Employee[];
  removidos: Employee[];
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
  errosDetalhados: ValidationErrorRow[];
  temErroCritico: boolean;
}

export interface BaseVersion {
  id: string;
  numero: number;
  data: string; // ISO datetime
  usuario: string;
  arquivo: string;
  total: number;
  novos: number;
  removidos: number;
  alterados: number;
  status: "processada" | "confirmada";
  diff?: VersionDiff;
  validation?: ValidationSummary;
}

export type AuditAction =
  | "upload_iniciado"
  | "upload_concluido"
  | "atualizacao_confirmada"
  | "colaborador_desligado"
  | "cnpj_alterado";

export interface AuditEvent {
  id: string;
  usuario: string;
  data: string; // ISO datetime
  acao: AuditAction;
  descricao: string;
}

export interface Company {
  id: string;
  nome: string;
  cnpjs: Cnpj[];
}

export interface Session {
  usuario: {
    nome: string;
    email: string;
    cargo: string;
  };
  empresa: Company;
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
