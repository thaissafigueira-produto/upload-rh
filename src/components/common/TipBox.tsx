import { Lightbulb } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TipBox({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl border border-tip-border bg-tip p-4 sm:flex-row sm:items-center", className)}>
      <div className="flex flex-1 items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white/70 text-primary">
          <Lightbulb className="size-4" />
        </span>
        <div className="text-sm leading-relaxed text-foreground">{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
