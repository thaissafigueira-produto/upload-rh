import { Download, FileSpreadsheet } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buildBeneficiosTemplate, downloadFile } from "@/lib/sample-file";
import { employeesService, type BeneficioAnalysis } from "@/services/employeesService";

export function BeneficiosImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<BeneficioAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  function close(next: boolean) {
    if (!next) {
      setFileName(null);
      setAnalysis(null);
      setError(null);
    }
    onOpenChange(next);
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setAnalysis(null);
    setFileName(file.name);
    try {
      setAnalysis(await employeesService.analyzeBeneficios(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível ler o arquivo.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Atualizar benefícios por planilha</DialogTitle>
          <DialogDescription>
            Envie uma planilha com as colunas Matrícula e Benefício (Com adesão ou Sem adesão). Você revisa o que vai mudar antes de aplicar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <FileSpreadsheet />
            {fileName ?? "Escolher arquivo"}
          </Button>
          <Button variant="link" size="sm" onClick={() => downloadFile(buildBeneficiosTemplate())}>
            <Download />
            Baixar modelo
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>

        {error && <p className="text-sm font-semibold text-destructive">{error}</p>}

        {analysis && (
          <div className="flex flex-col gap-3 text-sm">
            <p className="text-foreground">
              <strong>{analysis.aplicaveis.length}</strong> {analysis.aplicaveis.length === 1 ? "colaborador terá" : "colaboradores terão"} o benefício alterado
              · {analysis.semMudanca} já {analysis.semMudanca === 1 ? "está" : "estão"} como na planilha
              · <strong className={analysis.erros.length ? "text-destructive" : ""}>{analysis.erros.length}</strong> {analysis.erros.length === 1 ? "linha com problema" : "linhas com problemas"}
            </p>
            {analysis.erros.length > 0 && (
              <ul className="max-h-36 overflow-y-auto rounded-xl bg-rose-soft p-3 text-xs text-destructive">
                {analysis.erros.slice(0, 20).map((e) => (
                  <li key={e.linha}>Linha {e.linha}{e.matricula ? ` (${e.matricula})` : ""}: {e.problema}</li>
                ))}
                {analysis.erros.length > 20 && <li>… e mais {analysis.erros.length - 20}</li>}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">Linhas com problema são ignoradas; as demais podem ser aplicadas.</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)}>Cancelar</Button>
          <Button
            disabled={!analysis || analysis.aplicaveis.length === 0}
            onClick={() => {
              if (!analysis) return;
              employeesService.applyBeneficios(analysis.aplicaveis);
              toast.success(`Benefício atualizado para ${analysis.aplicaveis.length} ${analysis.aplicaveis.length === 1 ? "colaborador" : "colaboradores"}.`);
              close(false);
            }}
          >
            Aplicar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
