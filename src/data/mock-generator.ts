import { mulberry32, pick, pickN } from "@/lib/rng";
import type {
  AuditEvent,
  BaseVersion,
  Company,
  Department,
  Employee,
  EmployeeDiffChanged,
  FieldChange,
} from "@/types";

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

const DEPARTMENTS: Department[] = [
  "Tecnologia", "RH", "Financeiro", "Comercial", "Marketing", "Operações",
];

const CARGOS: Record<Department, string[]> = {
  Tecnologia: ["Engenheiro(a) de Software", "Analista de Sistemas", "Tech Lead", "QA Engineer", "Engenheiro(a) de Dados", "Product Manager"],
  RH: ["Analista de RH", "Business Partner de RH", "Recrutador(a)", "Coordenador(a) de RH", "Especialista em Benefícios"],
  Financeiro: ["Analista Financeiro", "Controller", "Analista de Contas a Pagar", "Coordenador(a) Financeiro"],
  Comercial: ["Executivo(a) de Contas", "SDR", "Gerente Comercial", "Analista Comercial", "Account Manager"],
  Marketing: ["Analista de Marketing", "Designer", "Especialista em Growth", "Coordenador(a) de Marketing"],
  Operações: ["Analista de Operações", "Coordenador(a) de Operações", "Especialista em Logística", "Gerente de Operações"],
};

const CNPJS = [
  { cnpj: "12.345.678/0001-01", razaoSocial: "Venturus Tecnologia Ltda (Matriz)" },
  { cnpj: "12.345.678/0002-82", razaoSocial: "Venturus Filial Campinas" },
  { cnpj: "12.345.678/0003-63", razaoSocial: "Venturus Filial Rio de Janeiro" },
];

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function pad(n: number, len: number) {
  return String(n).padStart(len, "0");
}

interface Identity {
  id: string;
  nome: string;
  matricula: string;
  departamento: Department;
  cargo: string;
  cnpj: string;
}

function buildIdentities(rand: () => number, count: number): Identity[] {
  const used = new Set<string>();
  const identities: Identity[] = [];
  for (let i = 0; i < count; i++) {
    let nome = "";
    let key = "";
    do {
      nome = `${pick(rand, FIRST_NAMES)} ${pick(rand, LAST_NAMES)}`;
      key = normalize(nome);
    } while (used.has(key));
    used.add(key);
    const departamento = DEPARTMENTS[i % DEPARTMENTS.length];
    identities.push({
      id: `emp-${pad(i + 1, 4)}`,
      nome,
      matricula: `VT${pad(i + 1, 5)}`,
      departamento,
      cargo: pick(rand, CARGOS[departamento]),
      cnpj: pick(rand, CNPJS).cnpj,
    });
  }
  return identities;
}

function emailFor(nome: string) {
  const parts = normalize(nome).split(" ");
  return `${parts[0]}.${parts[parts.length - 1]}@venturus.com.br`;
}

function isoAt(daysAgoFromToday: number) {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgoFromToday);
  return d.toISOString();
}

interface GenResult {
  company: Company;
  employees: Employee[];
  versions: BaseVersion[];
  audit: AuditEvent[];
}

export function generateDemoData(): GenResult {
  const rand = mulberry32(20260905);
  const identities = buildIdentities(rand, 132);

  const records = new Map<string, Employee>();
  const toEmployee = (identity: Identity, dataEntrada: string, dataAtualizacao: string): Employee => ({
    id: identity.id,
    nome: identity.nome,
    email: emailFor(identity.nome),
    matricula: identity.matricula,
    cnpj: identity.cnpj,
    departamento: identity.departamento,
    cargo: identity.cargo,
    status: "ativo",
    beneficio: rand() < 0.78 ? "com_adesao" : "sem_adesao",
    dataEntrada,
    dataAtualizacao,
  });

  // Version timeline: dates roughly monthly, ending near "today" in this session's context.
  const versionDates = [
    isoAt(133), // v1
    isoAt(103), // v2
    isoAt(73),  // v3
    isoAt(42),  // v4
    isoAt(11),  // v5 - "última atualização"
  ];

  const audit: AuditEvent[] = [];
  const versions: BaseVersion[] = [];
  let auditSeq = 0;
  const pushAudit = (data: string, acao: AuditEvent["acao"], descricao: string) => {
    auditSeq += 1;
    audit.push({ id: `audit-${pad(auditSeq, 4)}`, usuario: "Maria Andrade", data, acao, descricao });
  };

  // --- Version 1: first 96 identities enter the base.
  const v1Ids = identities.slice(0, 96);
  for (const identity of v1Ids) {
    records.set(identity.id, toEmployee(identity, versionDates[0], versionDates[0]));
  }
  pushAudit(versionDates[0], "upload_iniciado", "Upload da planilha base-inicial.xlsx");
  pushAudit(versionDates[0], "upload_concluido", "96 colaboradores processados com sucesso");
  pushAudit(versionDates[0], "atualizacao_confirmada", "Base inicial confirmada — versão 1");
  versions.push({
    id: "v1", numero: 1, data: versionDates[0], usuario: "Maria Andrade",
    arquivo: "base-inicial.xlsx", total: v1Ids.length, novos: v1Ids.length, removidos: 0,
    alterados: 0, status: "confirmada",
    diff: { novos: v1Ids.map((i) => records.get(i.id)!), removidos: [], alterados: [] },
  });

  type Step = { novos: Identity[]; removidosIds: string[]; changes: { id: string; campo: keyof Employee; novo: string }[]; resolvePending: boolean };

  const steps: Step[] = [
    {
      novos: identities.slice(96, 103),
      removidosIds: [identities[4].id, identities[16].id, identities[41].id],
      changes: [
        { id: identities[2].id, campo: "departamento", novo: "Financeiro" },
        { id: identities[7].id, campo: "cargo", novo: "Tech Lead" },
        { id: identities[11].id, campo: "cnpj", novo: CNPJS[1].cnpj },
        { id: identities[19].id, campo: "beneficio", novo: "com_adesao" },
        { id: identities[23].id, campo: "email", novo: `${normalize(identities[23].nome).split(" ")[0]}.silva.correto@venturus.com.br` },
        { id: identities[30].id, campo: "cargo", novo: "Coordenador(a) de RH" },
        { id: identities[34].id, campo: "departamento", novo: "Marketing" },
        { id: identities[45].id, campo: "cnpj", novo: CNPJS[2].cnpj },
        { id: identities[52].id, campo: "beneficio", novo: "sem_adesao" },
        { id: identities[60].id, campo: "cargo", novo: "Gerente Comercial" },
      ],
      resolvePending: true,
    },
    {
      novos: identities.slice(103, 109),
      removidosIds: [identities[22].id, identities[57].id],
      changes: [
        { id: identities[1].id, campo: "departamento", novo: "Operações" },
        { id: identities[9].id, campo: "cargo", novo: "Engenheiro(a) de Dados" },
        { id: identities[14].id, campo: "cnpj", novo: CNPJS[1].cnpj },
        { id: identities[27].id, campo: "beneficio", novo: "com_adesao" },
        { id: identities[38].id, campo: "cargo", novo: "Especialista em Growth" },
        { id: identities[49].id, campo: "email", novo: `${normalize(identities[49].nome).split(" ")[0]}.oficial@venturus.com.br` },
        { id: identities[64].id, campo: "departamento", novo: "Comercial" },
        { id: identities[70].id, campo: "cargo", novo: "Controller" },
      ],
      resolvePending: true,
    },
    {
      novos: identities.slice(109, 116),
      removidosIds: [identities[70].id, identities[87].id, identities[94].id],
      changes: [
        { id: identities[5].id, campo: "cnpj", novo: CNPJS[2].cnpj },
        { id: identities[18].id, campo: "cargo", novo: "Product Manager" },
        { id: identities[25].id, campo: "beneficio", novo: "sem_adesao" },
        { id: identities[33].id, campo: "departamento", novo: "Tecnologia" },
        { id: identities[40].id, campo: "cargo", novo: "Analista de Contas a Pagar" },
        { id: identities[47].id, campo: "beneficio", novo: "com_adesao" },
        { id: identities[55].id, campo: "cnpj", novo: CNPJS[0].cnpj },
        { id: identities[62].id, campo: "cargo", novo: "Account Manager" },
        { id: identities[68].id, campo: "departamento", novo: "Financeiro" },
        { id: identities[75].id, campo: "cargo", novo: "Coordenador(a) de Operações" },
        { id: identities[80].id, campo: "beneficio", novo: "sem_adesao" },
        { id: identities[85].id, campo: "cnpj", novo: CNPJS[1].cnpj },
      ],
      resolvePending: true,
    },
    {
      novos: identities.slice(116, 124),
      removidosIds: [identities[3].id, identities[59].id, identities[91].id, identities[112].id, identities[119].id, identities[10].id],
      changes: [
        { id: identities[8].id, campo: "cargo", novo: "QA Engineer" },
        { id: identities[13].id, campo: "departamento", novo: "Marketing" },
        { id: identities[21].id, campo: "beneficio", novo: "com_adesao" },
        { id: identities[29].id, campo: "cnpj", novo: CNPJS[2].cnpj },
        { id: identities[36].id, campo: "cargo", novo: "Business Partner de RH" },
        { id: identities[43].id, campo: "departamento", novo: "Comercial" },
        { id: identities[50].id, campo: "beneficio", novo: "sem_adesao" },
        { id: identities[58].id, campo: "cargo", novo: "Especialista em Benefícios" },
        { id: identities[66].id, campo: "cnpj", novo: CNPJS[0].cnpj },
      ],
      resolvePending: false, // last version: leave pendências for the demo
    },
  ];

  for (let s = 0; s < steps.length; s++) {
    const step = steps[s];
    const versionDate = versionDates[s + 1];
    const previousActive = [...records.values()].filter((e) => e.status === "ativo" && !e.naoEncontradoNaUltimaBase);

    // resolve prior pendências (simulate RH having handled older ones already)
    if (step.resolvePending) {
      for (const e of records.values()) {
        if (e.naoEncontradoNaUltimaBase) {
          e.status = "desligado";
          e.naoEncontradoNaUltimaBase = false;
        }
      }
    }

    const novosEmployees: Employee[] = [];
    for (const identity of step.novos) {
      const employee = toEmployee(identity, versionDate, versionDate);
      records.set(identity.id, employee);
      novosEmployees.push(employee);
    }

    const removidosEmployees: Employee[] = [];
    for (const id of step.removidosIds) {
      const existing = records.get(id);
      if (!existing) continue;
      removidosEmployees.push({ ...existing });
      if (s === steps.length - 1) {
        existing.naoEncontradoNaUltimaBase = true;
      } else {
        existing.naoEncontradoNaUltimaBase = true; // resolved on next step's resolvePending pass
      }
    }

    const alteradosDiff: EmployeeDiffChanged[] = [];
    for (const change of step.changes) {
      const existing = records.get(change.id);
      if (!existing) continue;
      const anterior = String(existing[change.campo]);
      (existing as unknown as Record<string, string>)[change.campo] = change.novo;
      existing.dataAtualizacao = versionDate;
      const fieldLabel: Record<string, string> = {
        departamento: "Departamento", cargo: "Cargo", cnpj: "CNPJ",
        beneficio: "Status do benefício", email: "E-mail corporativo",
      };
      const mudanca: FieldChange = {
        campo: fieldLabel[change.campo as string] ?? String(change.campo),
        anterior: change.campo === "beneficio" ? (anterior === "com_adesao" ? "Com adesão" : "Sem adesão") : anterior,
        novo: change.campo === "beneficio" ? (change.novo === "com_adesao" ? "Com adesão" : "Sem adesão") : change.novo,
      };
      alteradosDiff.push({ id: existing.id, nome: existing.nome, matricula: existing.matricula, mudancas: [mudanca] });
    }

    void previousActive;
    const numero = s + 2;
    const arquivo = `base-colaboradores-${new Date(versionDate).toISOString().slice(0, 10)}.xlsx`;
    pushAudit(versionDate, "upload_iniciado", `Upload da planilha ${arquivo}`);
    pushAudit(versionDate, "upload_concluido", `${novosEmployees.length + step.changes.length + step.removidosIds.length} diferenças identificadas`);
    pushAudit(versionDate, "atualizacao_confirmada", `Base atualizada — versão ${numero}`);

    const totalAtivos = [...records.values()].filter((e) => e.status === "ativo").length;
    versions.push({
      id: `v${numero}`,
      numero,
      data: versionDate,
      usuario: "Maria Andrade",
      arquivo,
      total: totalAtivos,
      novos: novosEmployees.length,
      removidos: removidosEmployees.length,
      alterados: alteradosDiff.length,
      status: "confirmada",
      diff: { novos: novosEmployees, removidos: removidosEmployees, alterados: alteradosDiff },
    });
  }

  // A couple of already-terminated employees marked manually (for status variety), unrelated to file diffs.
  const manualDesligados = pickN(rand, [...records.values()].filter((e) => e.status === "ativo" && !e.naoEncontradoNaUltimaBase), 3);
  for (const e of manualDesligados) {
    e.status = "desligado";
    pushAudit(isoAt(20), "colaborador_desligado", `${e.nome} marcado(a) como desligado(a) manualmente`);
  }

  const company: Company = { id: "venturus", nome: "Venturus", cnpjs: CNPJS };

  return {
    company,
    employees: [...records.values()],
    versions,
    audit: audit.sort((a, b) => a.data.localeCompare(b.data)),
  };
}
