import { mulberry32, pick, pickN } from "@/lib/rng";
import type {
  AuditEvent,
  BaseVersion,
  Cnpj,
  ConferenciaCnpj,
  Database,
  Employee,
  EmployeeDiffChanged,
  Empresa,
  FieldChange,
  Upload,
  Usuario,
  ValidationSummary,
  VinculoCnpj,
} from "@/types";

export const DB_VERSION = 3;
export const DEMO_EMPRESA_ID = "emp-venturus";

export const DEMO_USUARIO: Usuario = {
  id: "usr-maria",
  empresaId: DEMO_EMPRESA_ID,
  perfil: "rh",
  nome: "Maria Souza",
  email: "maria.souza@venturus.com.br",
  cargo: "Analista de RH",
};

export const GUAPECO_USUARIO: Usuario = {
  id: "usr-guapeco",
  empresaId: "",
  perfil: "guapeco",
  nome: "Ana Costa",
  email: "ana.costa@guapeco.com.br",
  cargo: "Financeiro Guapeco",
};

const FIRST_NAMES = [
  "Ana", "Bruno", "Carla", "Daniel", "Eduarda", "Felipe", "Gabriela", "Henrique",
  "Isabela", "João", "Karina", "Lucas", "Mariana", "Nicolas", "Olivia", "Pedro",
  "Queila", "Rafael", "Sabrina", "Thiago", "Ursula", "Vinícius", "Wagner", "Yasmin",
  "Aline", "Bernardo", "Camila", "Diego", "Elisa", "Fabio", "Giovanna", "Hugo",
  "Ingrid", "Julio", "Larissa", "Marcelo", "Natalia", "Otavio", "Patricia", "Rodrigo",
  "Sofia", "Tatiane", "Vitor", "William", "Ximena", "Yuri", "Zilda", "Amanda",
  "Caio", "Debora", "Emerson", "Flavia", "Gustavo", "Helena", "Igor", "Juliana",
  "Kevin", "Leticia", "Matheus", "Nadia", "Paulo", "Renata", "Samuel", "Tais",
];

const LAST_NAMES = [
  "Silva", "Souza", "Oliveira", "Santos", "Pereira", "Costa", "Rodrigues", "Almeida",
  "Nascimento", "Lima", "Araújo", "Fernandes", "Carvalho", "Gomes", "Martins", "Rocha",
  "Ribeiro", "Alves", "Monteiro", "Mendes", "Barros", "Freitas", "Barbosa", "Pinto",
  "Moreira", "Cardoso", "Teixeira", "Correia", "Dias", "Castro", "Campos", "Cavalcanti",
];

export const DEPARTMENTS = ["Tecnologia", "RH", "Financeiro", "Comercial", "Marketing", "Operações"];

const CARGOS: Record<string, string[]> = {
  Tecnologia: ["Engenheiro(a) de Software", "Analista de Sistemas", "Tech Lead", "QA Engineer", "Engenheiro(a) de Dados", "Product Manager"],
  RH: ["Analista de RH", "Business Partner de RH", "Recrutador(a)", "Coordenador(a) de RH", "Especialista em Benefícios"],
  Financeiro: ["Analista Financeiro", "Controller", "Analista de Contas a Pagar", "Coordenador(a) Financeiro"],
  Comercial: ["Executivo(a) de Contas", "SDR", "Gerente Comercial", "Analista Comercial", "Account Manager"],
  Marketing: ["Analista de Marketing", "Designer", "Especialista em Growth", "Coordenador(a) de Marketing"],
  Operações: ["Analista de Operações", "Coordenador(a) de Operações", "Especialista em Logística", "Gerente de Operações"],
};

const DDDS = ["11", "19", "21", "31", "41", "81"];

const pad = (n: number, len: number) => String(n).padStart(len, "0");
const at = (y: number, m: number, d: number, h = 14, min = 32) => new Date(y, m - 1, d, h, min).toISOString();
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

interface CompanyConfig {
  empresa: Empresa;
  prefix: string;
  domain: string;
  seed: number;
  identities: number;
  cnpjs: Omit<Cnpj, "empresaId">[];
  /** Limites acumulados para sortear o CNPJ dos ativos (tamanho = ativos - 1). */
  weights: number[];
  responsavel: string;
  steps: { data: string; novos: number; nao: number; alterados: number }[];
  conferencias: { competencia: string; apos: number; em: string }[];
  pendente: string;
  extras: { semCnpj: number; cnpjAlterados: number };
  historicoComProblemas: boolean;
}

const COMPANIES: CompanyConfig[] = [
  {
    empresa: { id: DEMO_EMPRESA_ID, nome: "Venturus", diaPrazoConferencia: 10 },
    prefix: "VT",
    domain: "venturus.com.br",
    seed: 20260905,
    identities: 170,
    cnpjs: [
      { id: "cnpj-1", cnpj: "12.345.678/0001-01", razaoSocial: "Venturus Centro de Inovação Ltda", ativo: true },
      { id: "cnpj-2", cnpj: "12.345.678/0002-82", razaoSocial: "Venturus Campinas Ltda", ativo: true },
      { id: "cnpj-3", cnpj: "12.345.678/0003-63", razaoSocial: "Venturus Serviços Ltda", ativo: true },
      { id: "cnpj-4", cnpj: "12.345.678/0004-44", razaoSocial: "Venturus Legado Ltda", ativo: false },
    ],
    weights: [0.5, 0.78],
    responsavel: "Maria Souza",
    steps: [
      { data: at(2026, 5, 5), novos: 118, nao: 0, alterados: 0 },
      { data: at(2026, 6, 5), novos: 12, nao: 4, alterados: 9 },
      { data: at(2026, 7, 5), novos: 10, nao: 3, alterados: 11 },
      { data: at(2026, 8, 5), novos: 9, nao: 6, alterados: 10 },
      { data: at(2026, 9, 5), novos: 10, nao: 8, alterados: 12 },
    ],
    conferencias: [
      { competencia: "2026-06", apos: 2, em: at(2026, 6, 8, 10, 15) },
      { competencia: "2026-07", apos: 3, em: at(2026, 7, 9, 9, 40) },
      { competencia: "2026-08", apos: 4, em: at(2026, 8, 7, 16, 5) },
      { competencia: "2026-09", apos: 5, em: at(2026, 9, 8, 11, 20) },
    ],
    pendente: "2026-10",
    extras: { semCnpj: 3, cnpjAlterados: 6 },
    historicoComProblemas: true,
  },
  {
    empresa: { id: "emp-lumia", nome: "Lumia Saúde", diaPrazoConferencia: 10 },
    prefix: "LM",
    domain: "lumiasaude.com.br",
    seed: 71024,
    identities: 74,
    cnpjs: [
      { id: "cnpj-lm-1", cnpj: "45.678.901/0001-10", razaoSocial: "Lumia Saúde Matriz Ltda", ativo: true },
      { id: "cnpj-lm-2", cnpj: "45.678.901/0002-91", razaoSocial: "Lumia Clínicas Ltda", ativo: true },
    ],
    weights: [0.6],
    responsavel: "Paula Ferraz",
    steps: [
      { data: at(2026, 7, 6, 10, 5), novos: 52, nao: 0, alterados: 0 },
      { data: at(2026, 8, 6, 10, 20), novos: 9, nao: 2, alterados: 5 },
      { data: at(2026, 9, 14, 9, 45), novos: 8, nao: 3, alterados: 6 },
    ],
    conferencias: [
      { competencia: "2026-08", apos: 2, em: at(2026, 8, 8, 15, 30) },
      { competencia: "2026-09", apos: 3, em: at(2026, 9, 16, 11, 0) },
    ],
    pendente: "2026-10",
    extras: { semCnpj: 2, cnpjAlterados: 3 },
    historicoComProblemas: false,
  },
  {
    empresa: { id: "emp-nordeste", nome: "Nordeste Logística", diaPrazoConferencia: 10 },
    prefix: "NL",
    domain: "nordestelog.com.br",
    seed: 33871,
    identities: 130,
    cnpjs: [
      { id: "cnpj-nl-1", cnpj: "31.402.550/0001-07", razaoSocial: "Nordeste Logística S.A.", ativo: true },
      { id: "cnpj-nl-2", cnpj: "31.402.550/0002-98", razaoSocial: "Nordeste Transportes Ltda", ativo: true },
      { id: "cnpj-nl-3", cnpj: "31.402.550/0003-79", razaoSocial: "Nordeste Armazéns Ltda", ativo: true },
    ],
    weights: [0.45, 0.8],
    responsavel: "Rogério Lima",
    steps: [
      { data: at(2026, 5, 12, 9, 10), novos: 90, nao: 0, alterados: 0 },
      { data: at(2026, 6, 12, 9, 25), novos: 14, nao: 3, alterados: 8 },
      { data: at(2026, 7, 12, 9, 15), novos: 10, nao: 5, alterados: 9 },
      { data: at(2026, 7, 28, 16, 40), novos: 6, nao: 4, alterados: 7 },
    ],
    conferencias: [
      { competencia: "2026-06", apos: 2, em: at(2026, 6, 15, 10, 0) },
      { competencia: "2026-07", apos: 3, em: at(2026, 7, 14, 14, 20) },
      { competencia: "2026-08", apos: 4, em: at(2026, 8, 12, 11, 45) },
    ],
    pendente: "2026-09",
    extras: { semCnpj: 1, cnpjAlterados: 2 },
    historicoComProblemas: false,
  },
  {
    empresa: { id: "emp-aurora", nome: "Aurora Varejo", diaPrazoConferencia: 10 },
    prefix: "AV",
    domain: "auroravarejo.com.br",
    seed: 90512,
    identities: 52,
    cnpjs: [
      { id: "cnpj-av-1", cnpj: "58.190.774/0001-30", razaoSocial: "Aurora Varejo S.A.", ativo: true },
      { id: "cnpj-av-2", cnpj: "58.190.774/0002-11", razaoSocial: "Aurora Lojas Ltda", ativo: true },
    ],
    weights: [0.55],
    responsavel: "Beatriz Nogueira",
    steps: [
      { data: at(2026, 8, 3, 11, 0), novos: 40, nao: 0, alterados: 0 },
      { data: at(2026, 9, 2, 11, 10), novos: 6, nao: 2, alterados: 4 },
    ],
    conferencias: [{ competencia: "2026-09", apos: 2, em: at(2026, 9, 4, 14, 50) }],
    pendente: "2026-10",
    extras: { semCnpj: 0, cnpjAlterados: 1 },
    historicoComProblemas: false,
  },
];

interface Shared {
  auditSeq: number;
}

function okValidation(total: number): ValidationSummary {
  return {
    totalRegistros: total, registrosValidos: total, erros: 0, duplicados: 0, emailsInvalidos: 0,
    camposObrigatoriosAusentes: 0, cnpjsNaoCadastrados: 0, problemasDeBase: 0, errosDetalhados: [], temErroCritico: false,
  };
}

function buildCompany(cfg: CompanyConfig, shared: Shared) {
  const rand = mulberry32(cfg.seed);
  const empresaId = cfg.empresa.id;
  const cnpjs: Cnpj[] = cfg.cnpjs.map((c) => ({ ...c, empresaId }));
  const activeCnpjs = cnpjs.filter((c) => c.ativo).map((c) => c.cnpj);
  const usuario = cfg.responsavel;
  const lower = cfg.prefix.toLowerCase();

  const emailFor = (nome: string, suffix = "") => {
    const parts = normalize(nome).split(" ");
    return `${parts[0]}.${parts[parts.length - 1]}${suffix}@${cfg.domain}`;
  };
  const phone = () => `(${pick(rand, DDDS)}) 9${pad(Math.floor(rand() * 10000), 4)}-${pad(Math.floor(rand() * 10000), 4)}`;

  interface Identity { id: string; nome: string; matricula: string; departamento: string; cargo: string; cnpj: string }
  const used = new Set<string>();
  const identities: Identity[] = [];
  for (let i = 0; i < cfg.identities; i++) {
    let nome = "";
    do {
      nome = `${pick(rand, FIRST_NAMES)} ${pick(rand, LAST_NAMES)}`;
    } while (used.has(normalize(nome)));
    used.add(normalize(nome));
    const departamento = DEPARTMENTS[i % DEPARTMENTS.length];
    const roll = rand();
    const idx = cfg.weights.findIndex((w) => roll < w);
    identities.push({
      id: `col-${lower}-${pad(i + 1, 4)}`,
      nome,
      matricula: `${cfg.prefix}${pad(i + 1, 5)}`,
      departamento,
      cargo: pick(rand, CARGOS[departamento]),
      cnpj: activeCnpjs[idx === -1 ? activeCnpjs.length - 1 : idx],
    });
  }

  const records = new Map<string, Employee>();
  const audit: AuditEvent[] = [];
  const uploads: Upload[] = [];
  const versions: BaseVersion[] = [];
  const conferencias: ConferenciaCnpj[] = [];

  const pushAudit = (ev: Omit<AuditEvent, "id" | "empresaId" | "usuario">) => {
    shared.auditSeq += 1;
    audit.push({ id: `aud-${pad(shared.auditSeq, 6)}`, empresaId, usuario, ...ev });
  };

  const toEmployee = (identity: Identity, data: string): Employee => ({
    id: identity.id,
    empresaId,
    nome: identity.nome,
    email: emailFor(identity.nome),
    matricula: identity.matricula,
    cnpj: identity.cnpj,
    departamento: identity.departamento,
    cargo: identity.cargo,
    telefone: phone(),
    status: "ativo",
    beneficio: rand() < 0.72 ? "com_adesao" : "sem_adesao",
    dataEntrada: data,
    dataAtualizacao: data,
  });

  const vinculosAgora = (): VinculoCnpj[] =>
    [...records.values()]
      .filter((e) => e.beneficio === "com_adesao" && e.status !== "desligado" && e.cnpj)
      .map((e) => ({ employeeId: e.id, nome: e.nome, matricula: e.matricula, cnpj: e.cnpj }));

  let cursor = 0;
  let lastNovosStart = 0;
  cfg.steps.forEach((step, s) => {
    const numero = s + 1;
    const isLast = s === cfg.steps.length - 1;
    const uploadId = `upl-${empresaId}-${numero}`;
    const arquivo = `base-colaboradores-${step.data.slice(0, 10)}.xlsx`;

    const novos: Employee[] = [];
    lastNovosStart = cursor;
    for (const identity of identities.slice(cursor, cursor + step.novos)) {
      const employee = toEmployee(identity, step.data);
      records.set(identity.id, employee);
      novos.push(clone(employee));
      pushAudit({
        data: step.data, acao: "colaborador_entrou_na_base", entidadeTipo: "colaborador",
        entidadeId: employee.id, entidadeNome: employee.nome,
        descricao: `${employee.nome} entrou na base (versão ${numero})`,
      });
    }
    cursor += step.novos;

    const pool = (): Employee[] => [...records.values()].filter((e) => e.status === "ativo" && !novos.some((n) => n.id === e.id));
    const naoEncontrados: Employee[] = [];
    if (step.nao > 0) {
      const withAdesao = pool().filter((e) => e.beneficio === "com_adesao");
      const withoutAdesao = pool().filter((e) => e.beneficio === "sem_adesao");
      const nComAdesao = isLast ? Math.min(step.nao, Math.max(2, step.nao - 3)) : 0;
      const chosen = isLast
        ? [...pickN(rand, withAdesao, nComAdesao), ...pickN(rand, withoutAdesao, step.nao - nComAdesao)]
        : pickN(rand, pool(), step.nao);
      for (const employee of chosen) {
        naoEncontrados.push(clone(employee));
        employee.status = "nao_encontrado";
        employee.dataAtualizacao = step.data;
        pushAudit({
          data: step.data, acao: "colaborador_nao_encontrado", entidadeTipo: "colaborador",
          entidadeId: employee.id, entidadeNome: employee.nome,
          valorAnterior: "Ativo", valorNovo: "Não encontrado na última base",
          descricao: `${employee.nome} não apareceu na base da versão ${numero}`,
        });
      }
    }

    const alterados: EmployeeDiffChanged[] = [];
    for (const employee of pickN(rand, pool(), step.alterados)) {
      const mudancas: FieldChange[] = [];
      const roll = rand();
      if (roll < 0.35) {
        const novo = pick(rand, activeCnpjs.filter((c) => c !== employee.cnpj));
        mudancas.push({ campo: "CNPJ", anterior: employee.cnpj, novo, destaque: true });
        employee.cnpj = novo;
      } else if (roll < 0.6) {
        const departamento = pick(rand, DEPARTMENTS.filter((d) => d !== employee.departamento));
        const cargo = pick(rand, CARGOS[departamento]);
        mudancas.push({ campo: "Departamento", anterior: employee.departamento, novo: departamento });
        mudancas.push({ campo: "Cargo", anterior: employee.cargo, novo: cargo });
        employee.departamento = departamento;
        employee.cargo = cargo;
      } else if (roll < 0.85) {
        const cargo = pick(rand, CARGOS[employee.departamento].filter((c) => c !== employee.cargo));
        mudancas.push({ campo: "Cargo", anterior: employee.cargo, novo: cargo });
        employee.cargo = cargo;
      } else {
        const novo = emailFor(employee.nome, "2");
        mudancas.push({ campo: "E-mail corporativo", anterior: employee.email, novo });
        employee.email = novo;
      }
      employee.dataAtualizacao = step.data;
      alterados.push({ id: employee.id, nome: employee.nome, matricula: employee.matricula, mudancas });
      for (const m of mudancas) {
        pushAudit({
          data: step.data, acao: m.campo === "CNPJ" ? "cnpj_alterado" : "colaborador_alterado",
          entidadeTipo: "colaborador", entidadeId: employee.id, entidadeNome: employee.nome,
          valorAnterior: m.anterior, valorNovo: m.novo,
          descricao: `${m.campo} de ${employee.nome} alterado na versão ${numero}`,
        });
      }
    }

    const total = [...records.values()].filter((e) => e.status !== "desligado").length;
    const versaoId = `ver-${empresaId}-${numero}`;
    versions.push({
      id: versaoId, empresaId, numero, data: step.data, usuario, arquivo,
      origem: "upload_manual", uploadId, total, colaboradores: clone([...records.values()]),
    });
    uploads.push({
      id: uploadId, empresaId, arquivo, tamanho: 30000 + Math.round(rand() * 20000),
      data: step.data, usuario, origem: "upload_manual", modo: "completa", status: "confirmada", versaoId,
      validation: okValidation(total),
      total, novos: novos.length, naoEncontrados: naoEncontrados.length, alterados: alterados.length,
      diff: { novos, naoEncontrados, alterados },
    });
    pushAudit({ data: step.data, acao: "upload_iniciado", entidadeTipo: "upload", entidadeId: uploadId, entidadeNome: arquivo, descricao: `Upload da planilha ${arquivo}` });
    pushAudit({ data: step.data, acao: "upload_concluido", entidadeTipo: "upload", entidadeId: uploadId, entidadeNome: arquivo, descricao: `${total} colaboradores processados` });
    pushAudit({ data: step.data, acao: "atualizacao_confirmada", entidadeTipo: "upload", entidadeId: uploadId, entidadeNome: arquivo, descricao: `Base atualizada — versão ${numero}` });

    if (!isLast) {
      const resolvedAt = new Date(new Date(step.data).getTime() + 2 * 86400000).toISOString();
      for (const flagged of naoEncontrados) {
        const employee = records.get(flagged.id)!;
        employee.status = "desligado";
        employee.dataDesligamento = resolvedAt;
        employee.dataAtualizacao = resolvedAt;
        pushAudit({
          data: resolvedAt, acao: "colaborador_desligado", entidadeTipo: "colaborador",
          entidadeId: employee.id, entidadeNome: employee.nome,
          valorAnterior: "Não encontrado na última base", valorNovo: "Desligado",
          descricao: `${employee.nome} marcado(a) como desligado(a)`,
        });
      }
    }

    const conferencia = cfg.conferencias.find((c) => c.apos === numero);
    if (conferencia) {
      const [ano, mes] = conferencia.competencia.split("-").map(Number);
      conferencias.push({
        id: `conf-${empresaId}-${conferencia.competencia}`, empresaId, competencia: conferencia.competencia,
        prazo: at(ano, mes, cfg.empresa.diaPrazoConferencia, 23, 59), status: "confirmada", confirmadoPor: usuario,
        confirmadoEm: conferencia.em, vinculos: vinculosAgora(),
      });
      pushAudit({
        data: conferencia.em, acao: "conferencia_confirmada", entidadeTipo: "conferencia",
        entidadeId: `conf-${empresaId}-${conferencia.competencia}`, entidadeNome: `Conferência ${pad(mes, 2)}/${ano}`,
        descricao: `Conferência de CNPJs de ${pad(mes, 2)}/${ano} confirmada`,
      });
    }
  });

  // Depois da última conferência: alguns colaboradores com adesão ficaram sem CNPJ e outros trocaram de CNPJ.
  const lastNovos = identities.slice(lastNovosStart, cursor);
  const semCnpj = lastNovos.slice(0, cfg.extras.semCnpj);
  for (const identity of semCnpj) {
    const employee = records.get(identity.id)!;
    employee.beneficio = "com_adesao";
    employee.cnpj = "";
  }
  const semCnpjIds = new Set(semCnpj.map((i) => i.id));
  const candidatos = [...records.values()].filter(
    (e) => e.status === "ativo" && e.beneficio === "com_adesao" && e.cnpj && !semCnpjIds.has(e.id),
  );
  pickN(rand, candidatos, cfg.extras.cnpjAlterados).forEach((employee, idx) => {
    const novo = pick(rand, activeCnpjs.filter((c) => c !== employee.cnpj));
    const data = at(2026, 9, 10 + idx * 2, 15, 10);
    pushAudit({
      data, acao: "cnpj_alterado", entidadeTipo: "colaborador", entidadeId: employee.id, entidadeNome: employee.nome,
      valorAnterior: employee.cnpj, valorNovo: novo, descricao: `CNPJ de ${employee.nome} alterado`,
    });
    employee.cnpj = novo;
    employee.dataAtualizacao = data;
  });

  const [pAno, pMes] = cfg.pendente.split("-").map(Number);
  conferencias.push({
    id: `conf-${empresaId}-${cfg.pendente}`, empresaId, competencia: cfg.pendente,
    prazo: at(pAno, pMes, cfg.empresa.diaPrazoConferencia, 23, 59), status: "pendente",
  });

  if (cfg.historicoComProblemas) {
    const comErrosData = at(2026, 6, 3, 9, 12);
    uploads.push({
      id: `upl-${empresaId}-erro-1`, empresaId, arquivo: "base-colaboradores-rascunho.xlsx", tamanho: 41200,
      data: comErrosData, usuario, origem: "upload_manual", modo: "completa", status: "com_erros",
      total: 130, novos: 0, naoEncontrados: 0, alterados: 0,
      diff: { novos: [], naoEncontrados: [], alterados: [] },
      validation: {
        totalRegistros: 130, registrosValidos: 127, erros: 3, duplicados: 0, emailsInvalidos: 1,
        camposObrigatoriosAusentes: 1, cnpjsNaoCadastrados: 1, problemasDeBase: 0, temErroCritico: true,
        errosDetalhados: [
          { linha: 14, colaborador: "Colaborador de exemplo", campo: "E-mail corporativo", problema: "O e-mail não está em um formato válido" },
          { linha: 52, colaborador: "Colaborador de exemplo", campo: "Matrícula", problema: "Campo obrigatório não preenchido" },
          { linha: 87, colaborador: "Colaborador de exemplo", campo: "CNPJ", problema: "Este CNPJ não pertence à sua empresa" },
        ],
      },
    });
    uploads.push({
      id: `upl-${empresaId}-cancelada-1`, empresaId, arquivo: "base-colaboradores-teste.xlsx", tamanho: 39800,
      data: at(2026, 8, 1, 17, 45), usuario, origem: "upload_manual", modo: "completa", status: "cancelada",
      total: 141, novos: 0, naoEncontrados: 0, alterados: 0,
      diff: { novos: [], naoEncontrados: [], alterados: [] }, validation: okValidation(141),
    });
    pushAudit({ data: comErrosData, acao: "upload_iniciado", entidadeTipo: "upload", entidadeId: `upl-${empresaId}-erro-1`, entidadeNome: "base-colaboradores-rascunho.xlsx", descricao: "Upload da planilha base-colaboradores-rascunho.xlsx" });
    pushAudit({ data: at(2026, 8, 1, 17, 45), acao: "upload_cancelado", entidadeTipo: "upload", entidadeId: `upl-${empresaId}-cancelada-1`, entidadeNome: "base-colaboradores-teste.xlsx", descricao: "Atualização cancelada antes da confirmação" });
  }

  return { cnpjs, employees: [...records.values()], uploads, versions, conferencias, audit };
}

export function generateDemoDatabase(): Database {
  const shared: Shared = { auditSeq: 0 };
  const db: Database = {
    version: DB_VERSION,
    empresas: COMPANIES.map((c) => c.empresa),
    cnpjs: [],
    usuarios: [DEMO_USUARIO, GUAPECO_USUARIO],
    employees: [],
    uploads: [],
    versions: [],
    conferencias: [],
    audit: [],
  };
  for (const cfg of COMPANIES) {
    const built = buildCompany(cfg, shared);
    db.cnpjs.push(...built.cnpjs);
    db.employees.push(...built.employees);
    db.uploads.push(...built.uploads);
    db.versions.push(...built.versions);
    db.conferencias.push(...built.conferencias);
    db.audit.push(...built.audit);
  }
  db.uploads.sort((a, b) => a.data.localeCompare(b.data));
  db.audit.sort((a, b) => a.data.localeCompare(b.data));
  return db;
}
