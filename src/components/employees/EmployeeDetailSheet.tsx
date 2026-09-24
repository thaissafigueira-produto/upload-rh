import { format } from "date-fns";
import { AlertTriangle, ArrowRight, Building2, FilePlus2, PenLine, UserPlus, UserX } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
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
import { cnpjService } from "@/services/cnpjService";
import { useDatabase } from "@/services/database";
import { employeesService } from "@/services/employeesService";
import type { AuditAction } from "@/types";

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
};

const TIMELINE_LABEL: Partial<Record<AuditAction, string>> = {
  colaborador_entrou_na_base: "Entrou na base",
  colaborador_alterado: "Dados alterados",
  cnpj_alterado: "CNPJ alterado",
  cnpj_alterado_em_massa: "CNPJ alterado (em massa)",
  colaborador_nao_encontrado: "Não encontrado na base",
  colaborador_desligado: "Marcado como desligado",
};

export function EmployeeDetailSheet({ employeeId, onClose }: { employeeId: string | null; onClose: () => void }) {
  useDatabase();
  const employee = employeeId ? employeesService.get(employeeId) : undefined;
  const cnpjs = cnpjService.list();
  const cnpjsAtivos = cnpjService.listAtivos();
  const [editingCnpj, setEditingCnpj] = useState(false);
  const [nextCnpj, setNextCnpj] = useState("");
  const [desligarOpen, setDesligarOpen] = useState(false);
  const [dataDesligamento, setDataDesligamento] = useState(format(new Date(), "yyyy-MM-dd"));

  if (!employee) return null;
  const timeline = auditService.forEmployee(employee.id);
  const razao = cnpjs.find((c) => c.cnpj === employee.cnpj)?.razaoSocial;
  const isDesligado = employee.status === "desligado";

  function close() {
    setEditingCnpj(false);
    setDesligarOpen(false);
    onClose();
  }

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
              <p className="mt-1">Este colaborador não apareceu na base mais recente. Se ele saiu da empresa, marque como desligado.</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <EmployeeStatusBadge status={employee.status} />
            <BenefitStatusBadge status={employee.beneficio} />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Field label="E-mail corporativo" value={employee.email} /></div>
            <Field label="Matrícula" value={employee.matricula} />
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

        {!isDesligado && (
          <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
            {!editingCnpj && (
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
            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDesligarOpen(true)}>
              Marcar como desligado
            </Button>
          </div>
        )}
      </SheetContent>

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
            <Input
              type="date"
              value={dataDesligamento}
              max={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => setDataDesligamento(e.target.value)}
            />
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
    </Sheet>
  );
}
