import { FileSpreadsheet, UploadCloud, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/csv";
import { cn } from "@/lib/utils";

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

export function Dropzone({
  file, onFile, onRemove,
}: {
  file: File | null;
  onFile: (file: File) => void;
  onRemove: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const selected = files?.[0];
      if (!selected) return;
      if (!ACCEPTED_EXTENSIONS.some((ext) => selected.name.toLowerCase().endsWith(ext))) {
        setError("Formato não suportado. Envie um arquivo .xlsx ou .csv.");
        return;
      }
      setError(null);
      onFile(selected);
    },
    [onFile],
  );

  if (file) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-lilac bg-lilac-soft/60 p-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-primary">
          <FileSpreadsheet className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-foreground">{file.name}</p>
          <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <X />
          Remover
        </Button>
      </div>
    );
  }

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
          "flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors",
          isDragging ? "border-primary bg-lilac-soft" : "border-input bg-background hover:border-lilac hover:bg-lilac-soft/40",
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-lilac-soft">
          <UploadCloud className="size-5 text-primary" strokeWidth={1.75} />
        </span>
        <span>
          <span className="block text-base font-bold text-foreground">Arraste sua planilha aqui ou clique para selecionar</span>
          <span className="mt-1 block text-sm text-muted-foreground">Formatos aceitos: XLSX ou CSV</span>
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {error && <p className="mt-2 text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}
