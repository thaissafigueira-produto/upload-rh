import {
  AlertTriangle, ArrowLeft, CheckCircle2, Download, FileSpreadsheet, Loader2, Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChangedEmployeesTable, NewEmployeesTable, RemovedEmployeesTable } from "@/components/upload/ChangeTables";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Dropzone } from "@/components/upload/Dropzone";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { computeDiff } from "@/lib/diff";
import { ParseError, parseEmployeeFile } from "@/lib/parse-file";
import { buildSampleNextVersionFile, downloadTemplate } from "@/lib/sample-file";
import { useStore } from "@/lib/store";
import { validateRows } from "@/lib/validate";
import type { ValidationSummary } from "@/types";

type Step = "inicio" | "analisando" | "erros" | "comparacao" | "sucesso";

export default function UpdateBase() {
  const { employees, startValidation, cancelUpload, confirmUpdate, pendingUpload } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("inicio");
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<{ novos: number; removidos: number; alterados: number; versaoId: string } | null>(null);

  async function handleFile(file: File) {
    setParseError(null);
    setStep("analisando");
    try {
      const { rows, linhasIgnoradas } = await parseEmployeeFile(file);
      const validation = validateRows(rows);
      await new Promise((r) => setTimeout(r, 700));

      if (linhasIgnoradas > 0) {
        toast.info(
          linhasIgnoradas === 1
            ? "1 linha da planilha foi ignorada por estar quase vazia (provável anotação, não um colaborador)."
            : `${linhasIgnoradas} linhas da planilha foram ignoradas por estarem quase vazias (prováveis anotações, não colaboradores).`,
        );
      }

      if (validation.temErroCritico) {
        setSummary(validation);
        setStep("erros");
        return;
      }

      const computed = computeDiff(employees, rows, new Date().toISOString());
      setSummary(validation);
      startValidation(file, validation, computed);
      setStep("comparacao");
    } catch (err) {
      setParseError(err instanceof ParseError ? err.message : "Não foi possível processar o arquivo. Tente novamente.");
      setStep("inicio");
    }
  }

  function handleReset() {
    cancelUpload();
    setSummary(null);
    setParseError(null);
    setResult(null);
    setStep("inicio");
  }

  function handleConfirm() {
    const version = confirmUpdate();
    if (!version) return;
    setResult({ novos: version.novos, removidos: version.removidos, alterados: version.alterados, versaoId: version.id });
    setConfirmOpen(false);
    setStep("sucesso");
  }

  if (step === "sucesso" && result) {
    return (
      <div className="mx-auto max-w-xl py-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-soft">
          <CheckCircle2 className="size-7 text-success" />
        </div>
        <h1 className="mt-5 text-xl font-semibold tracking-tight text-foreground">Base atualizada com sucesso.</h1>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-sm">
          <span className="text-success">{result.novos} novos</span>
          <span className="text-muted-foreground">{result.removidos} removidos</span>
          <span className="text-foreground">{result.alterados} alterados</span>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(`/historico?v=${result.versaoId}`)}>Ver alterações</Button>
          <Button onClick={() => navigate("/colaboradores")}>Ver colaboradores</Button>
        </div>
      </div>
    );
  }

  if (step === "comparacao" && pendingUpload?.computed) {
    const { diff } = pendingUpload.computed;
    return (
      <div>
        <PageHeader
          title="Revise as alterações antes de atualizar sua base."
          subtitle="Confira exatamente o que vai mudar em relação à base atual antes de confirmar."
        />
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-foreground">Resumo da atualização</p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
              <span className="text-success">+{diff.novos.length} novos colaboradores</span>
              <span className="text-muted-foreground">−{diff.removidos.length} colaboradores removidos</span>
              <span className="text-foreground">{diff.alterados.length} colaboradores alterados</span>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="novos" className="mt-6">
          <TabsList>
            <TabsTrigger value="novos">Novos ({diff.novos.length})</TabsTrigger>
            <TabsTrigger value="removidos">Removidos ({diff.removidos.length})</TabsTrigger>
            <TabsTrigger value="alterados">Alterados ({diff.alterados.length})</TabsTrigger>
          </TabsList>
          <div className="mt-4 rounded-lg border border-border p-4">
            <TabsContent value="novos"><NewEmployeesTable employees={diff.novos} /></TabsContent>
            <TabsContent value="removidos"><RemovedEmployeesTable employees={diff.removidos} /></TabsContent>
            <TabsContent value="alterados"><ChangedEmployeesTable changes={diff.alterados} /></TabsContent>
          </div>
        </Tabs>

        <div className="mt-6 flex items-center gap-3">
          <Button variant="ghost" onClick={handleReset}>
            <ArrowLeft className="size-4" />
            Cancelar
          </Button>
          <Button onClick={() => setConfirmOpen(true)}>Confirmar atualização</Button>
        </div>

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Confirmar atualização da base?"
          description="Esta ação cria uma nova versão da base de colaboradores. As versões anteriores continuam disponíveis no histórico."
          confirmLabel="Confirmar atualização"
          onConfirm={handleConfirm}
        />
      </div>
    );
  }

  if (step === "erros" && summary) {
    return (
      <div>
        <PageHeader title="Validação concluída" subtitle="Corrija os problemas abaixo e envie a base novamente." />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryStat label="Total de registros" value={summary.totalRegistros} />
          <SummaryStat label="Registros válidos" value={summary.registrosValidos} tone="success" />
          <SummaryStat label="Erros" value={summary.erros} tone="destructive" />
          <SummaryStat label="Duplicados" value={summary.duplicados} tone="warning" />
        </div>

        <div className="mt-6 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          A base não pode ser confirmada enquanto houver erros críticos.
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Linha</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>Campo</TableHead>
                <TableHead>Problema</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.errosDetalhados.map((e, idx) => (
                <TableRow key={`${e.linha}-${e.campo}-${idx}`}>
                  <TableCell className="text-muted-foreground">{e.linha}</TableCell>
                  <TableCell className="font-medium text-foreground">{e.colaborador}</TableCell>
                  <TableCell className="text-muted-foreground">{e.campo}</TableCell>
                  <TableCell className="text-destructive">{e.problema}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Button className="mt-6" variant="outline" onClick={handleReset}>
          <ArrowLeft className="size-4" />
          Enviar a base novamente
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Atualizar base de colaboradores"
        subtitle="Envie uma nova versão da sua base para manter os colaboradores elegíveis atualizados."
      />

      <Card className="mb-6">
        <CardContent>
          <p className="text-sm font-medium text-foreground">Antes de começar</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Utilize nossa estrutura padrão para garantir que sua base seja processada corretamente.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Campos do modelo: Nome, E-mail corporativo, Matrícula, CNPJ, Departamento, Cargo, Status.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="size-4" />
              Baixar modelo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFile(buildSampleNextVersionFile(employees))}
            >
              <Sparkles className="size-4" />
              Usar arquivo de exemplo
            </Button>
          </div>
        </CardContent>
      </Card>

      {step === "analisando" ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Loader2 className="size-6 animate-spin text-brand" />
            <p className="text-sm font-medium text-foreground">Analisando sua base...</p>
            <p className="text-xs text-muted-foreground">Isso leva apenas alguns instantes.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Dropzone onFile={handleFile} />
          {parseError && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-destructive">
              <AlertTriangle className="size-4" />
              {parseError}
            </p>
          )}
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileSpreadsheet className="size-3.5" />
            Formatos aceitos: XLSX ou CSV.
          </p>
        </>
      )}
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone?: "success" | "destructive" | "warning" }) {
  const toneClass = tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`mt-1.5 text-xl font-semibold tracking-tight ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
