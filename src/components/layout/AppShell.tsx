import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Star4 } from "@/components/status/StatusBadge";
import { Wordmark } from "@/components/common/Wordmark";
import { authService } from "@/services/authService";
import { useDatabase } from "@/services/database";
import type { PerfilUsuario } from "@/types";

export function AppShell({ perfil }: { perfil: PerfilUsuario }) {
  useDatabase();
  const { pathname, key } = useLocation();

  useEffect(() => {
    document.getElementById("main-scroll")?.scrollTo({ top: 0 });
  }, [pathname]);

  const user = authService.currentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.perfil !== perfil) return <Navigate to={user.perfil === "guapeco" ? "/guapeco" : "/"} replace />;

  return (
    <div className="flex h-dvh bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between px-4 md:justify-end md:px-8">
          <Wordmark className="text-xl md:hidden" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lilac-soft px-3 py-1 text-xs font-bold text-primary">
            <Star4 className="size-2.5 text-lilac" />
            Ambiente de demonstração
          </span>
        </header>
        <main id="main-scroll" className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[84rem] px-4 pt-4 pb-16 md:px-8">
            <Outlet key={key} />
          </div>
        </main>
      </div>
    </div>
  );
}
