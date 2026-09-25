import { format } from "date-fns";
import { AlertTriangle, ArrowRight, Building2, FilePlus2, Heart, PenLine, UserCheck, UserPlus, UserX } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { BenefitStatusBadge, EmployeeStatusBadge } from "@/components/status/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { shortRazaoSocial } from "@/lib/cnpj";
import { formatDate, formatDateTime } from "@/lib/format";
import { auditService } from "@/services/auditService";
import { authService } from "@/services/authService";
import { cnpjService } from "@/services/cnpjService";
import { useDatabase } from "@/services/database";
import { employeesService, type EmployeeDataPatch } from "@/services/employeesService";
import type { AuditAction, BenefitStatus, Employee } from "@/types";

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

const TIMELINE_ICON: Partial<Record<AuditAction, ReactNode>> = {
  colaborador_entrou_na_base: <UserPlus className="size-3.5" />,
  colaborador_alterado: <PenLine className="size-3.5" />,
  cnpj_alterado: <Building2 className="size-3.5" />,
  cnpj_alterado_em_massa: <Building2 className="size-3.5" />,
  colaborador_nao_encontrado: <AlertTriangle className="size-3.5" />,
  colaborador_desligado: <UserX className="size-3.5" />,
  colaborador_reativado: <UserCheck className="size-3.5" />,
  beneficio_alterado: <Heart className="size-3.5" />,
  beneficio_alterado_em_massa: <Heart className="size-3.5" />,
};

const TIMELINE_LABEL: Partial<Record<AuditAction, string>> = {
  colaborador_entrou_na_base: "Entrou na base",
  colaborador_alterado: "Dados alterados",
  cnpj_alterado: "CNPJ alterado",
  cnpj_alterado_em_massa: "CNPJ alterado (em massa)",
  colaborador_nao_encontrado: "Não encontrado na base",
  colaborador_desligado: "Marcado como desligado",
  colaborador_reativado: "Voltou a ficar ativo",
  beneficio_alterado: "Benefício alterado",
  beneficio_alterado_em_massa: "Benefício alterado (em massa)",
};

function toDraft(e: Employee): EmployeeDataPatch {
  return { nome: e.nome, email: e.email, matricula: e.matricula, departamento: e.departamento, cargo: e.cargo, telefone: e.telefone };
}

export function EmployeeDetailSheet({ employeeId, onClose }: { employeeId: string | null; onClose: () => void }) {
  useDatabase();
  const employee = employeeId ? employeesService.get(employeeId) : undefined;
  const isRh = authService.currentUser()?.perfil === "rh";
  const cnpjs = cnpjService.list();
  const cnpjsAtivos = cnpjService.listAtivos();
  const departamentos = employeesService.departamentos();
  const [editingCnpj, setEditingCnpj] = useState(false);
  const [nextCnpj, setNextCnpj] = useState("");
  const [desligarOpen, setDesligarOpen] = useState(false);
  const [reativarOpen, setReativarOpen] = useState(false);
  const [dataDesligamento, setDataDesligamento] = useState(format(new Date(), "yyyy-MM-dd"));
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<EmployeeDataPatch | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  if (!employee) return null;
  const timeline = auditService.forEmployee(employee.id);
  const razao = cnpjs.find((c) => c.cnpj === employee.cnpj)?.razaoSocial;
  const isDesligado = employee.status === "desligado";

  function close() {
    setEditingCnpj(false);
    setDesligarOpen(false);
    setReativarOpen(false);
    setEditOpen(false);
    onClose();
  }

  function saveEdit() {
    if (!draft || !employee) return;
    const result = employeesService.updateData(employee.id, draft);
    if (!result.ok) {
      setEditError(result.motivo);
      return;
    }
    setEditOpen(false);
    toast.success("Dados do colaborador atualizados.");
  }

  const draftField = (key: keyof EmployeeDataPatch, label: string, extra?: { list?: string }) => (
    <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">
      {label}
      <Input
        value={draft?.[key] ?? ""}
        list={extra?.list}
        onChange={(e) => setDraft((d) => (d ? { ...d, [key]: e.target.value } : d))}
      />
    </label>
  );

  return (
    <Sheet open onOpenChange={(open) => !open && close()}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{employee.nome}</SheetTitle>
          <SheetDescription>{[employee.cargo, employee.departamento].filter(Boolean).join(" · ") || "Cargo não informado"}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-6">
          {employee.status === "nao_encontrado" && (
            <div className="rounded-2xl bg-warning-soft p-3.5 text-sm text-foreground">
              <p className="font-bold text-warning">Não encontrado na última base</p>
              <p className="mt-1">
                {isRh
                  ? "Este colaborador não apareceu na base mais recente. Se ele saiu da empresa, marque como desligado."
                  : "Este colaborador não apareceu na base mais recente enviada pela empresa. O RH da empresa vai decidir se ele foi desligado."}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <EmployeeStatusBadge status={employee.status} />
            <BenefitStatusBadge status={employee.beneficio} />
          </div>

          {!isRh && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Benefício</p>
              <Select
                value={employee.beneficio}
                onValueChange={(value) => {
                  employeesService.updateBeneficio(employee.id, value as BenefitStatus);
                  toast.success("Benefício atualizado.");
                }}
              >
                <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="com_adesao">Com adesão</SelectItem>
                  <SelectItem value="sem_adesao">Sem adesão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Field label="E-mail corporativo" value={employee.email} /></div>
            <Field label="Matrícula" value={employee.matricula} />
            <Field label="Telefone" value={employee.telefone || "—"} />
            <Field label="Departamento" value={employee.departamento || "—"} />
            <Field label="Cargo" value={employee.cargo || "—"} />
            <Field label="Data de entrada na base" value={formatDate(employee.dataEntrada)} />
            <Field label="Última atualização" value={formatDate(employee.dataAtualizacao)} />
            {employee.dataDesligamento && <Field label="Data de desligamento" value={formatDate(employee.dataDesligamento)} />}
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">CNPJ</p>
            {editingCnpj ? (
              <div className="mt-1.5 flex flex-col gap-2">
                <Select value={nextCnpj} onValueChange={setNextCnpj}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecione o CNPJ" /></SelectTrigger>
                  <SelectContent>
                    {cnpjsAtivos.map((c) => (
                      <SelectItem key={c.id} value={c.cnpj}>{shortRazaoSocial(c.razaoSocial)} — {c.cnpj}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={!nextCnpj || nextCnpj === employee.cnpj}
                    onClick={() => {
                      employeesService.updateCnpj(employee.id, nextCnpj);
                      setEditingCnpj(false);
                      toast.success("CNPJ atualizado com sucesso.");
                    }}
                  >
                    Salvar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingCnpj(false)}>Cancelar</Button>
                </div>
              </div>
            ) : employee.cnpj ? (
              <p className="mt-0.5 text-sm font-semibold text-foreground">
                {razao ? `${shortRazaoSocial(razao)} · ` : ""}{employee.cnpj}
              </p>
            ) : (
              <p className="mt-0.5 text-sm font-semibold text-warning">Sem CNPJ definido</p>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="text-base font-bold text-foreground">Linha do tempo</h3>
            {timeline.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Nenhum registro para este colaborador ainda.</p>
            ) : (
              <ol className="mt-3 flex flex-col gap-4 border-l-2 border-lilac-soft pl-4">
                {timeline.map((ev) => (
                  <li key={ev.id} className="relative">
                    <span className="absolute top-0.5 -left-[1.6rem] flex size-6 items-center justify-center rounded-full bg-lilac-soft text-primary">
                      {TIMELINE_ICON[ev.acao] ?? <FilePlus2 className="size-3.5" />}
                    </span>
                    <p className="text-sm font-bold text-foreground">{TIMELINE_LABEL[ev.acao] ?? ev.descricao}</p>
                    {ev.valorAnterior && ev.valorNovo && (
                      <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                        <span className="line-through">{ev.valorAnterior}</span>
                        <ArrowRight className="size-3" />
                        <span className="font-semibold text-foreground">{ev.valorNovo}</span>
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(ev.data)} · {ev.usuario}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {isRh && (
          <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
            <Button
              variant="outline"
              onClick={() => {
                setDraft(toDraft(employee));
                setEditError(null);
                setEditOpen(true);
              }}
            >
              Editar dados
            </Button>
            {!isDesligado && !editingCnpj && (
              <Button
                variant="outline"
                onClick={() => {
                  setNextCnpj(employee.cnpj);
                  setEditingCnpj(true);
                }}
              >
                Editar CNPJ
              </Button>
            )}
            {isDesligado ? (
              <Button variant="outline" onClick={() => setReativarOpen(true)}>Reativar colaborador</Button>
            ) : (
              <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDesligarOpen(true)}>
                Marcar como desligado
              </Button>
            )}
          </div>
        )}
      </SheetContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar dados do colaborador</DialogTitle>
            <DialogDescription>
              A matrícula identifica o colaborador nas próximas bases enviadas. Se você alterá-la, use a nova matrícula nas planilhas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">{draftField("nome", "Nome")}</div>
            <div className="sm:col-span-2">{draftField("email", "E-mail corporativo")}</div>
            {draftField("matricula", "Matrícula")}
            {draftField("telefone", "Telefone")}
            {draftField("departamento", "Departamento", { list: "departamentos-lista" })}
            {draftField("cargo", "Cargo")}
          </div>
          <datalist id="departamentos-lista">
            {departamentos.map((d) => <option key={d} value={d} />)}
          </datalist>
          {editError && <p className="text-sm font-semibold text-destructive">{editError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={saveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={desligarOpen} onOpenChange={setDesligarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar colaborador como desligado?</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja marcar este colaborador como desligado?
              {employee.beneficio === "com_adesao" && " Ele possui adesão ao benefício. A Guapeco será informada do desligamento."}
            </DialogDescription>
          </DialogHeader>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">
            Data do desligamento
            <Input type="date" value={dataDesligamento} max={format(new Date(), "yyyy-MM-dd")} onChange={(e) => setDataDesligamento(e.target.value)} />
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDesligarOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={!dataDesligamento}
              onClick={() => {
                employeesService.markAsDesligado(employee.id, dataDesligamento);
                setDesligarOpen(false);
                toast.success("Colaborador marcado como desligado.");
              }}
            >
              Marcar como desligado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={reativarOpen}
        onOpenChange={setReativarOpen}
        title="Reativar colaborador?"
        description="O colaborador volta a ficar ativo e a data de desligamento é removida. Essa ação fica registrada na linha do tempo."
        confirmLabel="Reativar"
        onConfirm={() => {
          employeesService.reactivate(employee.id);
          toast.success("Colaborador reativado.");
        }}
      />
    </Sheet>
  );
}
