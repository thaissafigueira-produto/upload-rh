import { ShieldCheck } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function Login() {
  const { isAuthenticated, login } = useStore();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-lg font-semibold tracking-tight text-foreground">Guapeco</span>
        </div>
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-lg font-semibold text-foreground">Entrar na plataforma</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Gerencie a população de colaboradores da sua empresa.
          </p>

          <button
            type="button"
            onClick={() => {
              login();
              navigate("/");
            }}
            className="mt-6 flex w-full items-center gap-3 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-brand/40 hover:bg-brand-soft/40"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-medium text-brand">
              {initials("Maria Andrade")}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">Maria Andrade</span>
              <span className="block truncate text-xs text-muted-foreground">Analista de RH · Venturus</span>
            </span>
          </button>

          <Button
            className="mt-5 w-full"
            size="lg"
            onClick={() => {
              login();
              navigate("/");
            }}
          >
            Entrar como Maria Andrade
          </Button>

          <p className="mt-4 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
            Ambiente de demonstração da Guapeco. Os dados de colaboradores exibidos aqui são
            fictícios e usados apenas para validar esta primeira versão do produto.
          </p>
        </div>
      </div>
    </div>
  );
}
