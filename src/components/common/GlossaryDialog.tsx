import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const TERMS = [
  ["Colaborador elegível", "Colaborador que está na base enviada pela empresa e pode aderir ao benefício."],
  ["Com adesão", "Colaborador que aderiu ao benefício Guapeco."],
  ["Não encontrado na base", "Colaborador que estava na base anterior e não apareceu na mais recente."],
  ["Desligado", "Colaborador que o RH informou que saiu da empresa."],
  ["Versão da base", "Registro de como a base estava após cada atualização confirmada."],
  ["Conferência de CNPJs", "Confirmação mensal de a qual CNPJ cada colaborador com adesão pertence, usada para emitir as cobranças."],
];

export function GlossaryDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BookOpen />
          Glossário de termos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Glossário de termos</DialogTitle>
          <DialogDescription>Os principais termos usados na gestão da sua base.</DialogDescription>
        </DialogHeader>
        <dl className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1">
          {TERMS.map(([term, definition]) => (
            <div key={term}>
              <dt className="text-sm font-bold text-foreground">{term}</dt>
              <dd className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{definition}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
