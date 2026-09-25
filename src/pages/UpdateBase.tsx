import {
  AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Download, Loader2, PawPrint, Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { Stepper } from "@/components/common/Stepper";
import { TipBox } from "@/components/common/TipBox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChangedEmployeesTable, NaoEncontradosTable, NewEmployeesTable } from "@/components/upload/ChangeTables";
import { Dropzone } from "@/components/upload/Dropzone";
import { ErrorsTable } from "@/components/upload/ErrorsTable";
import { downloadTextFile } from "@/lib/csv";
import { formatNumber } from "@/lib/format";
import { ParseError } from "@/lib/parse-file";
import { buildSampleFile, buildTemplateFile, downloadFile } from "@/lib/sample-file";
import { cn } from "@/lib/utils";
import { cnpjService } from "@/services/cnpjService";
import { useDatabase } from "@/services/database";
import { employeesService } from "@/services/employeesService";
import { uploadsService, type AnalysisResult } from "@/services/uploadsService";
import { MODO_LABEL } from "@/lib/modos";
import type { ModoEnvio, Upload } from "@/types";

const STEPS = ["Enviar arquivo", "Validação", "O que mudou", "Confirmar"];

const CAMPOS_NOVOS = ["Nome *", "E-mail corporativo *", "Matrícula *", "CNPJ *", "Departamento", "Cargo", "Telefone"];
const FIELDS: Record<ModoEnvio, string[]> = {
  completa: [...CAMPOS_NOVOS, "Status (Ativo/Desligado)", "Data de desligamento"],
  novos: CAMPOS_NOVOS,
  desligamentos: ["Matrícula *", "Data de desligamento *", "Nome (opcional)"],
};

const MODO_INFO: Record<ModoEnvio, string> = {
  completa: "Envie todos os colaboradores da empresa. Dados alterados são atualizados e quem não aparecer fica como “Não encontrado na última base” para você revisar.",
  novos: "Envie apenas quem entrou na empresa. Quem já está na base não é alterado nem marcado como não encontrado.",
  desligamentos: "Envie apenas quem saiu da empresa, com a matrícula e a data de desligamento. Mais ninguém é alterado.",
};

type Phase = "enviar" | "analisando" | "validacao" | "mudancas" | "confirmar" | "sucesso";

const STEP_INDEX: Record<Phase, number> = { enviar: 0, analisando: 1, validacao: 1, mudancas: 2, confirmar: 3, sucesso: 4 };

export default function UpdateBase() {
  useDatabase();
  const [phase, setPhase] = useState<Phase>("enviar");
  const [modo, setModo] = useState<ModoEnvio>("completa");
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<Upload | null>(null);
  const pendingId = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (pendingId.current) uploadsService.cancel(pendingId.current);
    };
  }, []);

  async function analyze(chosen: File) {
    setParseError(null);
    setPhase("analisando");
    try {
      const [analysisResult] = await Promise.all([
        uploadsService.analyze(chosen, modo),
        new Promise((r) => setTimeout(r, 800)),
      ]);
      setAnalysis(analysisResult);
      pendingId.current = analysisResult.upload.status === "validado" ? analysisResult.upload.id : null;
      setPhase("validacao");
    } catch (err) {
      setParseError(err instanceof ParseError ? err.message : "Não foi possível processar o arquivo. Confira o formato e tente novamente.");
      setPhase("enviar");
    }
  }

  function reset() {
    if (pendingId.current) uploadsService.cancel(pendingId.current);
    pendingId.current = null;
    setFile(null);
    setAnalysis(null);
    setParseError(null);
    setResult(null);
    setPhase("enviar");
  }

  function loadSample(withErrors: boolean) {
    const sample = buildSampleFile(employeesService.list(), cnpjService.list(), modo, withErrors);
    setFile(sample);
    void analyze(sample);
  }

  function confirm() {
    if (!analysis) return;
    const confirmed = uploadsService.confirm(analysis.upload.id);
    setConfirmOpen(false);
    if (!confirmed) {
      toast.error("Não foi possível confirmar a atualização. Envie a base novamente.");
      return;
    }
    pendingId.current = null;
    setResult(confirmed.upload);
    setPhase("sucesso");
  }

  function downloadErrors() {
    if (!analysis) return;
    const csv = uploadsService.exportErrorsCsv(analysis.upload.id);
    if (csv) downloadTextFile(csv.filename, csv.content);
  }

  const upload = analysis?.upload;

  if (phase === "sucesso" && result) {
    return (
      <div>
        <div className="mb-8"><Stepper steps={STEPS} current={STEPS.length} /></div>
        <div className="mx-auto max-w-xl py-6 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success-soft">
            <PawPrint className="size-8 text-success" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground">Base atualizada com sucesso.</h1>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-base font-semibold">
            {result.modo === "desligamentos" ? (
              <span className="text-foreground">{result.alterados} {result.alterados === 1 ? "desligamento registrado" : "desligamentos registrados"}</span>
            ) : (
              <>
                <span className="text-success">{result.novos} novos</span>
                {result.modo === "completa" && <span className="text-warning">{result.naoEncontrados} não encontrados</span>}
                {result.modo === "completa" && <span className="text-foreground">{result.alterados} alterados</span>}
              </>
            )}
          </div>
          {result.naoEncontrados > 0 && (
            <TipBox className="mt-6 text-left">
              {result.naoEncontrados} {result.naoEncontrados === 1 ? "colaborador não foi encontrado" : "colaboradores não foram encontrados"} na nova base.
              Revise se foram desligados.{" "}
              <Link to="/colaboradores?status=nao_encontrado" className="font-semibold text-primary underline underline-offset-4">
                Revisar agora
              </Link>
            </TipBox>
          )}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline" asChild><Link to={`/historico/${result.id}`}>Ver alterações</Link></Button>
            <Button asChild><Link to="/colaboradores">Ver colaboradores</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Atualizar base de colaboradores"
        subtitle="Envie a versão mais recente da sua base para manter os colaboradores elegíveis atualizados."
      />
      <div className="mb-8"><Stepper steps={STEPS} current={STEP_INDEX[phase]} /></div>

      {phase === "enviar" && (
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="mb-3 text-lg font-bold text-foreground">O que você vai enviar?</h2>
            <div role="radiogroup" aria-label="Tipo de envio" className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {(Object.keys(MODO_LABEL) as ModoEnvio[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={modo === m}
                  onClick={() => { setModo(m); setFile(null); setParseError(null); }}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-colors",
                    modo === m ? "border-primary bg-lilac-soft" : "border-border bg-card hover:bg-muted",
                  )}
                >
                  <span className="block text-base font-bold text-foreground">{MODO_LABEL[m]}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{MODO_INFO[m]}</span>
                </button>
              ))}
            </div>
          </div>

          <TipBox
            action={
              <Button variant="outline" size="sm" onClick={() => downloadFile(buildTemplateFile(modo, cnpjService.listAtivos()[0]?.cnpj))}>
                <Download />
                Baixar modelo
              </Button>
            }
          >
            <strong>Antes de começar:</strong> use o modelo deste tipo de envio para garantir que sua planilha seja processada corretamente.
          </TipBox>

          <Card>
            <CardContent>
              <h2 className="text-lg font-bold text-foreground">Campos do modelo</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {FIELDS[modo].map((f) => (
                  <span key={f} className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">{f}</span>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">* campo obrigatório</p>
            </CardContent>
          </Card>

          <div>
            <Dropzone file={file} onFile={setFile} onRemove={() => { setFile(null); setParseError(null); }} />
            {parseError && (
              <p className="mt-3 flex items-start gap-2 text-sm font-medium text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                {parseError}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" disabled={!file} onClick={() => file && analyze(file)}>
              Continuar
              <ArrowRight />
            </Button>
            <span className="text-sm text-muted-foreground">ou teste com um arquivo de exemplo:</span>
            <Button variant="ghost" size="sm" onClick={() => loadSample(false)}>
              <Sparkles />
              Usar exemplo válido
            </Button>
            <Button variant="ghost" size="sm" onClick={() => loadSample(true)}>
              <Sparkles />
              Usar exemplo com erros
            </Button>
            <Button variant="link" size="sm" onClick={() => downloadFile(buildSampleFile(employeesService.list(), cnpjService.list(), modo, true))}>
              Baixar arquivo de exemplo
            </Button>
          </div>
        </div>
      )}

      {phase === "analisando" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Loader2 className="size-7 animate-spin text-primary" />
            <p className="text-lg font-bold text-foreground">Analisando sua base...</p>
            <p className="text-sm text-muted-foreground">Isso leva apenas alguns instantes.</p>
          </CardContent>
        </Card>
      )}

      {phase === "validacao" && upload && (
        <div>
          <div className="mb-5 flex items-center gap-3">
            {upload.validation.temErroCritico ? (
              <AlertTriangle className="size-6 text-destructive" />
            ) : (
              <CheckCircle2 className="size-6 text-success" />
            )}
            <h2 className="text-2xl font-bold text-foreground">Validação concluída</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <SummaryStat label="Total de registros" value={upload.validation.totalRegistros} />
            <SummaryStat label="Registros válidos" value={upload.validation.registrosValidos} tone="success" />
            <SummaryStat label="Erros" value={upload.validation.erros} tone={upload.validation.erros ? "destructive" : undefined} />
            <SummaryStat label="Duplicados" value={upload.validation.duplicados} tone={upload.validation.duplicados ? "warning" : undefined} />
            <SummaryStat label="E-mails inválidos" value={upload.validation.emailsInvalidos} tone={upload.validation.emailsInvalidos ? "destructive" : undefined} />
            <SummaryStat label="Campos obrigatórios ausentes" value={upload.validation.camposObrigatoriosAusentes} tone={upload.validation.camposObrigatoriosAusentes ? "destructive" : undefined} />
            <SummaryStat label="CNPJs não cadastrados" value={upload.validation.cnpjsNaoCadastrados} tone={upload.validation.cnpjsNaoCadastrados ? "destructive" : undefined} />
            {upload.modo !== "completa" && (
              <SummaryStat label="Problemas com a base atual" value={upload.validation.problemasDeBase} tone={upload.validation.problemasDeBase ? "destructive" : undefined} />
            )}
          </div>

          {(analysis?.linhasIgnoradas ?? 0) > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              {analysis!.linhasIgnoradas} {analysis!.linhasIgnoradas === 1 ? "linha foi ignorada" : "linhas foram ignoradas"} por estar(em) quase vazia(s) — provavelmente anotações, não colaboradores.
            </p>
          )}

          {upload.validation.temErroCritico ? (
            <>
              <div className="mt-6 flex items-center gap-2 rounded-2xl bg-rose-soft px-4 py-3 text-sm font-semibold text-destructive">
                <AlertTriangle className="size-4 shrink-0" />
                Corrija os problemas abaixo e envie a base novamente.
              </div>
              <div className="mt-4 overflow-hidden rounded-2xl border border-border">
                <ErrorsTable errors={upload.validation.errosDetalhados} />
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button onClick={reset}><ArrowLeft />Enviar a base novamente</Button>
                <Button variant="outline" onClick={downloadErrors}><Download />Baixar lista de erros (CSV)</Button>
              </div>
            </>
          ) : (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={reset}><ArrowLeft />Enviar outra base</Button>
              <Button onClick={() => setPhase("mudancas")}>Ver o que mudou<ArrowRight /></Button>
            </div>
          )}
        </div>
      )}

      {phase === "mudancas" && upload && (
        <div>
          <h2 className="mb-1 text-2xl font-bold text-foreground">O que mudou na sua base</h2>
          <p className="mb-5 text-muted-foreground">Comparação da nova base com a versão atual.</p>
          <ChangeSummary upload={upload} />
          <ChangeTabs upload={upload} />
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button variant="ghost" onClick={reset}>Cancelar</Button>
            <Button onClick={() => setPhase("confirmar")}>Continuar<ArrowRight /></Button>
          </div>
        </div>
      )}

      {phase === "confirmar" && upload && (
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold text-foreground">Revise as alterações antes de atualizar sua base.</h2>
          <p className="mt-1 mb-5 text-muted-foreground">
            Arquivo <strong className="text-foreground">{upload.arquivo}</strong> · {formatNumber(upload.validation.totalRegistros)} colaboradores na nova base.
          </p>
          <ChangeSummary upload={upload} />
          {upload.naoEncontrados > 0 && (
            <TipBox className="mt-5">
              {upload.naoEncontrados} {upload.naoEncontrados === 1 ? "colaborador ficará" : "colaboradores ficarão"} como “Não encontrado na última base” até você revisar se foram desligados.
            </TipBox>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button variant="ghost" onClick={reset}>Cancelar</Button>
            <Button variant="outline" onClick={() => setPhase("mudancas")}><ArrowLeft />Voltar</Button>
            <Button onClick={() => setConfirmOpen(true)}>Confirmar atualização</Button>
          </div>
          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Confirmar atualização da base?"
            description="Esta ação cria uma nova versão da base de colaboradores. As versões anteriores continuam disponíveis no histórico e não podem ser alteradas."
            confirmLabel="Confirmar atualização"
            onConfirm={confirm}
          />
        </div>
      )}
    </div>
  );
}

function ChangeSummary({ upload }: { upload: Upload }) {
  if (upload.modo === "novos") {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryStat label="Novos colaboradores" value={upload.novos} prefix="+" tone="success" />
      </div>
    );
  }
  if (upload.modo === "desligamentos") {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryStat label="Desligamentos" value={upload.alterados} />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <SummaryStat label="Novos colaboradores" value={upload.novos} prefix="+" tone="success" />
      <SummaryStat label="Não encontrados" value={upload.naoEncontrados} prefix="−" tone={upload.naoEncontrados ? "warning" : undefined} />
      <SummaryStat label="Alterados" value={upload.alterados} />
    </div>
  );
}

function ChangeTabs({ upload }: { upload: Upload }) {
  const cnpjs = cnpjService.list();
  const { diff } = upload;
  const parcial = upload.modo !== "completa";
  return (
    <Tabs defaultValue={upload.modo === "desligamentos" ? "alterados" : "novos"} className="mt-6">
      <TabsList>
        {upload.modo !== "desligamentos" && <TabsTrigger value="novos">Novos ({diff.novos.length})</TabsTrigger>}
        {!parcial && <TabsTrigger value="nao_encontrados">Não encontrados ({diff.naoEncontrados.length})</TabsTrigger>}
        {upload.modo !== "novos" && (
          <TabsTrigger value="alterados">
            {upload.modo === "desligamentos" ? "Desligamentos" : "Alterados"} ({diff.alterados.length})
          </TabsTrigger>
        )}
      </TabsList>
      <div className="mt-4 rounded-2xl border border-border p-4">
        <TabsContent value="novos"><NewEmployeesTable employees={diff.novos} cnpjs={cnpjs} /></TabsContent>
        <TabsContent value="nao_encontrados">
          {diff.naoEncontrados.some((e) => e.beneficio === "com_adesao") && (
            <p className="mb-3 text-sm text-muted-foreground">
              Quem tem <strong className="text-primary">adesão</strong> aparece em destaque: pode impactar o faturamento.
            </p>
          )}
          <NaoEncontradosTable employees={diff.naoEncontrados} cnpjs={cnpjs} />
        </TabsContent>
        <TabsContent value="alterados"><ChangedEmployeesTable changes={diff.alterados} /></TabsContent>
      </div>
    </Tabs>
  );
}

function SummaryStat({
  label, value, tone, prefix = "",
}: {
  label: string;
  value: number;
  tone?: "success" | "destructive" | "warning";
  prefix?: string;
}) {
  return (
    <Card>
      <CardContent className="px-5">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-1 text-3xl font-bold tracking-tight",
            tone === "success" && "text-success",
            tone === "destructive" && "text-destructive",
            tone === "warning" && "text-warning",
            !tone && "text-foreground",
          )}
        >
          {prefix}{formatNumber(value)}
        </p>
      </CardContent>
    </Card>
  );
}
