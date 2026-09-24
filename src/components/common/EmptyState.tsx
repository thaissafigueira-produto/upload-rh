import { PawPrint, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon = PawPrint,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-input bg-muted/40 px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-lilac-soft">
        <Icon className="size-5 text-primary" strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-base font-bold text-foreground">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
