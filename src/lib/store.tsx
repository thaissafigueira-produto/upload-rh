import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { generateDemoData } from "@/data/mock-generator";
import { computeDiff } from "@/lib/diff";
import type { AuditEvent, BaseVersion, Company, Employee, ValidationSummary } from "@/types";

const STORAGE_KEY = "guapeco-rh-data-v1";

interface PersistedData {
  company: Company;
  employees: Employee[];
  versions: BaseVersion[];
  audit: AuditEvent[];
}

function loadPersisted(): PersistedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PersistedData;
  } catch {
    // ignora dado corrompido e recria a base de demonstração
  }
  const seed = generateDemoData();
  return seed;
}

function persist(data: PersistedData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // armazenamento indisponível (ex.: modo privado) — segue apenas em memória
  }
}

export interface DemoUser {
  nome: string;
  email: string;
  cargo: string;
}

const DEMO_USER: DemoUser = { nome: "Thaissa Figueira", email: "thaissa.figueira@venturus.com.br", cargo: "Analista de RH" };

interface PendingUpload {
  file: File;
  status: "validando" | "validado";
  summary: ValidationSummary;
  computed: ReturnType<typeof computeDiff> | null;
}

interface StoreValue {
  isAuthenticated: boolean;
  user: DemoUser | null;
  company: Company;
  employees: Employee[];
  versions: BaseVersion[];
  audit: AuditEvent[];
  pendingUpload: PendingUpload | null;
  login: () => void;
  logout: () => void;
  markAsDesligado: (employeeId: string) => void;
  updateCnpj: (employeeId: string, cnpj: string) => void;
  startValidation: (file: File, summary: ValidationSummary, computed: ReturnType<typeof computeDiff> | null) => void;
  cancelUpload: () => void;
  confirmUpdate: () => BaseVersion | null;
  resetDemoData: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PersistedData>(() => loadPersisted());
  const [user, setUser] = useState<DemoUser | null>(null);
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);

  useEffect(() => {
    persist(data);
  }, [data]);

  const pushAudit = useCallback((acao: AuditEvent["acao"], descricao: string) => {
    setData((prev) => ({
      ...prev,
      audit: [
        ...prev.audit,
        { id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, usuario: DEMO_USER.nome, data: new Date().toISOString(), acao, descricao },
      ],
    }));
  }, []);

  const login = useCallback(() => setUser(DEMO_USER), []);
  const logout = useCallback(() => setUser(null), []);

  const markAsDesligado = useCallback((employeeId: string) => {
    setData((prev) => {
      const employee = prev.employees.find((e) => e.id === employeeId);
      if (!employee) return prev;
      const employees = prev.employees.map((e) =>
        e.id === employeeId ? { ...e, status: "desligado" as const, naoEncontradoNaUltimaBase: false, dataAtualizacao: new Date().toISOString() } : e,
      );
      return { ...prev, employees };
    });
    const employee = data.employees.find((e) => e.id === employeeId);
    pushAudit("colaborador_desligado", `${employee?.nome ?? "Colaborador"} marcado(a) como desligado(a)`);
  }, [data.employees, pushAudit]);

  const updateCnpj = useCallback((employeeId: string, cnpj: string) => {
    setData((prev) => {
      const employees = prev.employees.map((e) =>
        e.id === employeeId ? { ...e, cnpj, dataAtualizacao: new Date().toISOString() } : e,
      );
      return { ...prev, employees };
    });
    const employee = data.employees.find((e) => e.id === employeeId);
    pushAudit("cnpj_alterado", `CNPJ de ${employee?.nome ?? "colaborador"} alterado para ${cnpj}`);
  }, [data.employees, pushAudit]);

  const startValidation = useCallback((file: File, summary: ValidationSummary, computed: ReturnType<typeof computeDiff> | null) => {
    pushAudit("upload_iniciado", `Upload da planilha ${file.name}`);
    setPendingUpload({ file, status: "validado", summary, computed });
    pushAudit("upload_concluido", `${summary.registrosValidos} de ${summary.totalRegistros} registros válidos`);
  }, [pushAudit]);

  const cancelUpload = useCallback(() => setPendingUpload(null), []);

  const confirmUpdate = useCallback((): BaseVersion | null => {
    if (!pendingUpload?.computed) return null;
    const { diff, nextEmployees } = pendingUpload.computed;
    let created: BaseVersion | null = null;
    setData((prev) => {
      const numero = prev.versions.length + 1;
      const nowIso = new Date().toISOString();
      const version: BaseVersion = {
        id: `v${numero}`,
        numero,
        data: nowIso,
        usuario: DEMO_USER.nome,
        arquivo: pendingUpload.file.name,
        total: nextEmployees.filter((e) => e.status === "ativo").length,
        novos: diff.novos.length,
        removidos: diff.removidos.length,
        alterados: diff.alterados.length,
        status: "confirmada",
        diff,
        validation: pendingUpload.summary,
      };
      created = version;
      return { ...prev, employees: nextEmployees, versions: [...prev.versions, version] };
    });
    pushAudit("atualizacao_confirmada", `Base atualizada — versão ${data.versions.length + 1}`);
    setPendingUpload(null);
    return created;
  }, [pendingUpload, pushAudit, data.versions.length]);

  const resetDemoData = useCallback(() => {
    const seed = generateDemoData();
    setData(seed);
    setPendingUpload(null);
  }, []);

  const value = useMemo<StoreValue>(() => ({
    isAuthenticated: user !== null,
    user,
    company: data.company,
    employees: data.employees,
    versions: data.versions,
    audit: data.audit,
    pendingUpload,
    login,
    logout,
    markAsDesligado,
    updateCnpj,
    startValidation,
    cancelUpload,
    confirmUpdate,
    resetDemoData,
  }), [user, data, pendingUpload, login, logout, markAsDesligado, updateCnpj, startValidation, cancelUpload, confirmUpdate, resetDemoData]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore deve ser usado dentro de StoreProvider");
  return ctx;
}
