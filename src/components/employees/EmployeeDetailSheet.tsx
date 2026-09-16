import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { BenefitStatusBadge, EmployeeStatusBadge, PendingBadge } from "@/components/status/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Employee } from "@/types";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value}</p>
    </div>
  );
}

export function EmployeeDetailSheet({
  employee,
  onOpenChange,
}: {
  employee: Employee | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { company, markAsDesligado, updateCnpj } = useStore();
  const [editingCnpj, setEditingCnpj] = useState(false);
  const [nextCnpj, setNextCnpj] = useState("");
  const [confirmDesligar, setConfirmDesligar] = useState(false);

  if (!employee) return null;

  return (
    <Sheet open={Boolean(employee)} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{employee.nome}</SheetTitle>
          <SheetDescription>{employee.cargo} · {employee.departamento}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-6">
          {employee.naoEncontradoNaUltimaBase && (
            <div className="rounded-md bg-warning-soft px-3 py-2.5">
              <PendingBadge />
              <p className="mt-1.5 text-xs text-warning/90">
                Este colaborador não apareceu na última base enviada. Confirme se ele foi desligado.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <EmployeeStatusBadge status={employee.status} />
            <BenefitStatusBadge status={employee.beneficio} />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <Field label="E-mail corporativo" value={employee.email} />
            <Field label="Matrícula" value={employee.matricula} />
            <Field label="Departamento" value={employee.departamento} />
            <Field label="Cargo" value={employee.cargo} />
            <Field label="Data de entrada na base" value={formatDate(employee.dataEntrada)} />
            <Field label="Última atualização" value={formatDate(employee.dataAtualizacao)} />
          </div>

          <Separator />

          <div>
            <p className="text-xs text-muted-foreground">CNPJ</p>
            {editingCnpj ? (
              <div className="mt-1.5 flex flex-col gap-2">
                <Select value={nextCnpj} onValueChange={setNextCnpj}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o CNPJ" />
                  </SelectTrigger>
                  <SelectContent>
                    {company.cnpjs.map((c) => (
                      <SelectItem key={c.cnpj} value={c.cnpj}>
                        {c.cnpj} — {c.razaoSocial}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={!nextCnpj}
                    onClick={() => {
                      updateCnpj(employee.id, nextCnpj);
                      setEditingCnpj(false);
                      toast.success("CNPJ atualizado com sucesso.");
                    }}
                  >
                    Salvar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingCnpj(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-0.5 flex items-center justify-between">
                <p className="text-sm text-foreground">{employee.cnpj}</p>
              </div>
            )}
          </div>
        </div>

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
          {employee.status === "ativo" && (
            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setConfirmDesligar(true)}>
              Marcar como desligado
            </Button>
          )}
        </div>
      </SheetContent>

      <ConfirmDialog
        open={confirmDesligar}
        onOpenChange={setConfirmDesligar}
        title="Marcar colaborador como desligado?"
        description={`Tem certeza que deseja marcar ${employee.nome} como desligado? Essa ação fica registrada no histórico da empresa.`}
        confirmLabel="Marcar como desligado"
        destructive
        onConfirm={() => {
          markAsDesligado(employee.id);
          toast.success("Colaborador marcado como desligado.");
          onOpenChange(false);
        }}
      />
    </Sheet>
  );
}
