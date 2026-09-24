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
  VinculoCnpj,
} from "@/types";

export const DB_VERSION = 2;
export const DEMO_EMPRESA_ID = "emp-venturus";
export const DEMO_USUARIO: Usuario = {
  id: "usr-maria",
  empresaId: DEMO_EMPRESA_ID,
  nome: "Maria Souza",
  email: "maria.souza@venturus.com.br",
  cargo: "Analista de RH",
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

const CNPJS: Cnpj[] = [
  { id: "cnpj-1", empresaId: DEMO_EMPRESA_ID, cnpj: "12.345.678/0001-01", razaoSocial: "Venturus Centro de Inovação Ltda", ativo: true },
  { id: "cnpj-2", empresaId: DEMO_EMPRESA_ID, cnpj: "12.345.678/0002-82", razaoSocial: "Venturus Campinas Ltda", ativo: true },
  { id: "cnpj-3", empresaId: DEMO_EMPRESA_ID, cnpj: "12.345.678/0003-63", razaoSocial: "Venturus Serviços Ltda", ativo: true },
  { id: "cnpj-4", empresaId: DEMO_EMPRESA_ID, cnpj: "12.345.678/0004-44", razaoSocial: "Venturus Legado Ltda", ativo: false },
];
const ACTIVE_CNPJS = CNPJS.filter((c) => c.ativo).map((c) => c.cnpj);

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const pad = (n: number, len: number) => String(n).padStart(len, "0");
const at = (y: number, m: number, d: number, h = 14, min = 32) => new Date(y, m - 1, d, h, min).toISOString();
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

function emailFor(nome: string, suffix = "") {
  const parts = normalize(nome).split(" ");
  return `${parts[0]}.${parts[parts.length - 1]}${suffix}@venturus.com.br`;
}

interface Identity {
  id: string;
  nome: string;
  matricula: string;
  departamento: string;
  cargo: string;
  cnpj: string;
}

function buildIdentities(rand: () => number, count: number): Identity[] {
  const used = new Set<string>();
  const out: Identity[] = [];
  for (let i = 0; i < count; i++) {
    let nome = "";
    do {
      nome = `${pick(rand, FIRST_NAMES)} ${pick(rand, LAST_NAMES)}`;
    } while (used.has(normalize(nome)));
    used.add(normalize(nome));
    const departamento = DEPARTMENTS[i % DEPARTMENTS.length];
    const roll = rand();
    out.push({
      id: `col-${pad(i + 1, 4)}`,
      nome,
      matricula: `VT${pad(i + 1, 5)}`,
      departamento,
      cargo: pick(rand, CARGOS[departamento]),
      cnpj: roll < 0.5 ? ACTIVE_CNPJS[0] : roll < 0.78 ? ACTIVE_CNPJS[1] : ACTIVE_CNPJS[2],
    });
  }
  return out;
}

const STEPS = [
  { data: at(2026, 5, 5), novos: 118, nao: 0, alterados: 0 },
  { data: at(2026, 6, 5), novos: 12, nao: 4, alterados: 9 },
  { data: at(2026, 7, 5), novos: 10, nao: 3, alterados: 11 },
  { data: at(2026, 8, 5), novos: 9, nao: 6, alterados: 10 },
  { data: at(2026, 9, 5), novos: 10, nao: 8, alterados: 12 },
];

const CONFERENCIAS_CONFIRMADAS = [
  { competencia: "2026-06", apos: 2, em: at(2026, 6, 8, 10, 15) },
  { competencia: "2026-07", apos: 3, em: at(2026, 7, 9, 9, 40) },
  { competencia: "2026-08", apos: 4, em: at(2026, 8, 7, 16, 5) },
  { competencia: "2026-09", apos: 5, em: at(2026, 9, 8, 11, 20) },
];

export function generateDemoDatabase(): Database {
  const rand = mulberry32(20260905);
  const identities = buildIdentities(rand, 170);
  const records = new Map<string, Employee>();
  const audit: AuditEvent[] = [];
  const uploads: Upload[] = [];
  const versions: BaseVersion[] = [];
  const conferencias: ConferenciaCnpj[] = [];
  const usuario = DEMO_USUARIO.nome;
  let auditSeq = 0;

  const pushAudit = (ev: Omit<AuditEvent, "id" | "empresaId" | "usuario">) => {
    auditSeq += 1;
    audit.push({ id: `aud-${pad(auditSeq, 5)}`, empresaId: DEMO_EMPRESA_ID, usuario, ...ev });
  };

  const toEmployee = (identity: Identity, data: string): Employee => ({
    id: identity.id,
    empresaId: DEMO_EMPRESA_ID,
    nome: identity.nome,
    email: emailFor(identity.nome),
    matricula: identity.matricula,
    cnpj: identity.cnpj,
    departamento: identity.departamento,
    cargo: identity.cargo,
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
  STEPS.forEach((step, s) => {
    const numero = s + 1;
    const isLast = s === STEPS.length - 1;
    const uploadId = `upl-${numero}`;
    const arquivo = `base-colaboradores-${step.data.slice(0, 10)}.xlsx`;

    const novos: Employee[] = [];
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
      const chosen = isLast
        ? [...pickN(rand, withAdesao, 5), ...pickN(rand, withoutAdesao, step.nao - 5)]
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
        const novo = pick(rand, ACTIVE_CNPJS.filter((c) => c !== employee.cnpj));
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
    const versaoId = `ver-${numero}`;
    versions.push({
      id: versaoId, empresaId: DEMO_EMPRESA_ID, numero, data: step.data, usuario, arquivo,
      origem: "upload_manual", uploadId, total, colaboradores: clone([...records.values()]),
    });
    uploads.push({
      id: uploadId, empresaId: DEMO_EMPRESA_ID, arquivo, tamanho: 30000 + Math.round(rand() * 20000),
      data: step.data, usuario, origem: "upload_manual", status: "confirmada", versaoId,
      validation: {
        totalRegistros: total, registrosValidos: total, erros: 0, duplicados: 0, emailsInvalidos: 0,
        camposObrigatoriosAusentes: 0, cnpjsNaoCadastrados: 0, errosDetalhados: [], temErroCritico: false,
      },
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

    const conferencia = CONFERENCIAS_CONFIRMADAS.find((c) => c.apos === numero);
    if (conferencia) {
      const [ano, mes] = conferencia.competencia.split("-").map(Number);
      conferencias.push({
        id: `conf-${conferencia.competencia}`, empresaId: DEMO_EMPRESA_ID, competencia: conferencia.competencia,
        prazo: at(ano, mes, 10, 23, 59), status: "confirmada", confirmadoPor: usuario,
        confirmadoEm: conferencia.em, vinculos: vinculosAgora(),
      });
      pushAudit({
        data: conferencia.em, acao: "conferencia_confirmada", entidadeTipo: "conferencia",
        entidadeId: `conf-${conferencia.competencia}`, entidadeNome: `Conferência ${pad(mes, 2)}/${ano}`,
        descricao: `Conferência de CNPJs de ${pad(mes, 2)}/${ano} confirmada`,
      });
    }
  });

  // Após a última conferência: alguns colaboradores com adesão trocaram de CNPJ e outros ficaram sem CNPJ.
  const lastNovos = identities.slice(cursor - STEPS[4].novos, cursor);
  for (const identity of lastNovos.slice(0, 3)) {
    const employee = records.get(identity.id)!;
    employee.beneficio = "com_adesao";
    employee.cnpj = "";
  }
  const semCnpjIds = new Set(lastNovos.slice(0, 3).map((i) => i.id));
  const candidatos = [...records.values()].filter(
    (e) => e.status === "ativo" && e.beneficio === "com_adesao" && e.cnpj && !semCnpjIds.has(e.id),
  );
  pickN(rand, candidatos, 6).forEach((employee, idx) => {
    const novo = pick(rand, ACTIVE_CNPJS.filter((c) => c !== employee.cnpj));
    const data = at(2026, 9, 10 + idx * 2, 15, 10);
    pushAudit({
      data, acao: "cnpj_alterado", entidadeTipo: "colaborador", entidadeId: employee.id, entidadeNome: employee.nome,
      valorAnterior: employee.cnpj, valorNovo: novo, descricao: `CNPJ de ${employee.nome} alterado`,
    });
    employee.cnpj = novo;
    employee.dataAtualizacao = data;
  });

  conferencias.push({
    id: "conf-2026-10", empresaId: DEMO_EMPRESA_ID, competencia: "2026-10", prazo: at(2026, 10, 10, 23, 59), status: "pendente",
  });

  // Tentativas anteriores que não viraram versão (aparecem no histórico como "Com erros" e "Cancelada").
  const okValidation = (total: number) => ({
    totalRegistros: total, registrosValidos: total, erros: 0, duplicados: 0, emailsInvalidos: 0,
    camposObrigatoriosAusentes: 0, cnpjsNaoCadastrados: 0, errosDetalhados: [], temErroCritico: false,
  });
  const emptyDiff = { novos: [], naoEncontrados: [], alterados: [] };
  const comErrosData = at(2026, 6, 3, 9, 12);
  uploads.push({
    id: "upl-erro-1", empresaId: DEMO_EMPRESA_ID, arquivo: "base-colaboradores-rascunho.xlsx", tamanho: 41200,
    data: comErrosData, usuario, origem: "upload_manual", status: "com_erros", total: 130, novos: 0, naoEncontrados: 0, alterados: 0,
    diff: emptyDiff,
    validation: {
      totalRegistros: 130, registrosValidos: 127, erros: 3, duplicados: 0, emailsInvalidos: 1,
      camposObrigatoriosAusentes: 1, cnpjsNaoCadastrados: 1, temErroCritico: true,
      errosDetalhados: [
        { linha: 14, colaborador: "Colaborador de exemplo", campo: "E-mail corporativo", problema: "O e-mail não está em um formato válido" },
        { linha: 52, colaborador: "Colaborador de exemplo", campo: "Matrícula", problema: "Campo obrigatório não preenchido" },
        { linha: 87, colaborador: "Colaborador de exemplo", campo: "CNPJ", problema: "Este CNPJ não pertence à sua empresa" },
      ],
    },
  });
  uploads.push({
    id: "upl-cancelada-1", empresaId: DEMO_EMPRESA_ID, arquivo: "base-colaboradores-teste.xlsx", tamanho: 39800,
    data: at(2026, 8, 1, 17, 45), usuario, origem: "upload_manual", status: "cancelada", total: 141, novos: 0, naoEncontrados: 0, alterados: 0,
    diff: emptyDiff, validation: okValidation(141),
  });
  pushAudit({ data: comErrosData, acao: "upload_iniciado", entidadeTipo: "upload", entidadeId: "upl-erro-1", entidadeNome: "base-colaboradores-rascunho.xlsx", descricao: "Upload da planilha base-colaboradores-rascunho.xlsx" });
  pushAudit({ data: at(2026, 8, 1, 17, 45), acao: "upload_cancelado", entidadeTipo: "upload", entidadeId: "upl-cancelada-1", entidadeNome: "base-colaboradores-teste.xlsx", descricao: "Atualização cancelada antes da confirmação" });

  const empresa: Empresa = { id: DEMO_EMPRESA_ID, nome: "Venturus", diaPrazoConferencia: 10 };

  return {
    version: DB_VERSION,
    empresas: [empresa],
    cnpjs: CNPJS,
    usuarios: [DEMO_USUARIO],
    employees: [...records.values()],
    uploads: uploads.sort((a, b) => a.data.localeCompare(b.data)),
    versions,
    conferencias,
    audit: audit.sort((a, b) => a.data.localeCompare(b.data)),
  };
}
