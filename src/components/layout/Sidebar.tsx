import { LayoutGrid, History, Users, UploadCloud } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Visão geral", icon: LayoutGrid, end: true },
  { to: "/colaboradores", label: "Colaboradores", icon: Users, end: false },
  { to: "/atualizar-base", label: "Atualizar base", icon: UploadCloud, end: false },
  { to: "/historico", label: "Histórico", icon: History, end: false },
];

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-soft text-brand"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )
            }
          >
            <item.icon className="size-4" strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border p-4 text-xs text-muted-foreground">
        <p>Ambiente de demonstração</p>
        <p className="mt-0.5">Dados fictícios da Venturus</p>
      </div>
    </aside>
  );
}
