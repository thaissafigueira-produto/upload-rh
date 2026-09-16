import { FileSpreadsheet, UploadCloud } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

export function Dropzone({ onFile }: { onFile: (file: File) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      const isValid = ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
      if (!isValid) {
        setError("Formato não suportado. Envie um arquivo .xlsx ou .csv.");
        return;
      }
      setError(null);
      onFile(file);
    },
    [onFile],
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-14 text-center transition-colors",
          isDragging ? "border-brand bg-brand-soft/40" : "border-border hover:border-foreground/25 hover:bg-muted/40",
        )}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <UploadCloud className="size-5 text-muted-foreground" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Arraste sua planilha aqui ou clique para selecionar
          </p>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <FileSpreadsheet className="size-3.5" />
            Arquivos .xlsx ou .csv
          </p>
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
