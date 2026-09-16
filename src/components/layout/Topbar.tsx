import { ChevronDown, LogOut, RotateCcw, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/format";
import { useStore } from "@/lib/store";

export function Topbar() {
  const { user, company, logout, resetDemoData } = useStore();
  const navigate = useNavigate();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        <span className="text-[15px] font-semibold tracking-tight text-foreground">Guapeco</span>
        <span className="text-border">/</span>
        <span className="text-sm font-medium text-muted-foreground">{company.nome}</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent">
          <Avatar className="size-7">
            <AvatarFallback className="bg-brand-soft text-xs font-medium text-brand">
              {user ? initials(user.nome) : ""}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-medium leading-tight text-foreground">{user?.nome}</span>
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium text-foreground">{user?.nome}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              resetDemoData();
              toast.success("Dados de demonstração restaurados.");
            }}
          >
            <RotateCcw className="size-4" />
            Restaurar dados de demonstração
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <ShieldCheck className="size-4" />
            Privacidade e segurança
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              logout();
              navigate("/login");
            }}
          >
            <LogOut className="size-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
