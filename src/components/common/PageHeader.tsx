import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { GlossaryDialog } from "@/components/common/GlossaryDialog";

export interface Crumb {
  label: string;
  to?: string;
}

export function PageHeader({
  title,
  subtitle,
  action,
  breadcrumb,
  glossary = true,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  breadcrumb?: Crumb[];
  glossary?: boolean;
}) {
  return (
    <div className="mb-8">
      {breadcrumb && (
        <nav aria-label="Você está em" className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          {breadcrumb.map((crumb, idx) => (
            <span key={crumb.label} className="flex items-center gap-1.5">
              {idx > 0 && <ChevronRight className="size-3.5" />}
              {crumb.to ? (
                <Link to={crumb.to} className="font-medium text-primary underline underline-offset-4 hover:text-primary-hover">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            {glossary && <GlossaryDialog />}
          </div>
          {subtitle && <p className="mt-2 max-w-2xl text-base text-muted-foreground">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
