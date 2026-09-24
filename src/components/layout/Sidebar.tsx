import { Building2, ChevronsUpDown, LayoutGrid, LogOut, RotateCcw, UploadCloud, UserRound, Users, History } from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Wordmark } from "@/components/common/Wordmark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { authService } from "@/services/authService";
import { cnpjService } from "@/services/cnpjService";
import { useDatabase } from "@/services/database";

export function Sidebar() {
  useDatabase();
  const navigate = useNavigate();
  const user = authService.currentUser();
  const empresa = authService.currentEmpresa();
  const pendingCnpjs = cnpjService.pendingCount();
  const [profileOpen, setProfileOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);

  const items = [
    { to: "/", label: "Visão geral", icon: LayoutGrid, end: true },
    { to: "/colaboradores", label: "Colaboradores", icon: Users, end: false },
    { to: "/atualizar-base", label: "Atualizar base", icon: UploadCloud, end: false },
    { to: "/cnpjs", label: "CNPJs", icon: Building2, end: false, badge: pendingCnpjs },
    { to: "/historico", label: "Histórico", icon: History, end: false },
  ];

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="px-6 pt-7 pb-5">
        <Wordmark />
      </div>

      <div className="px-3 pb-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-2xl border border-sidebar-border bg-white/60 p-2.5 text-left outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="size-9">
              <AvatarFallback className="bg-lilac-soft text-xs font-bold text-primary">{user ? initials(user.nome) : ""}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-foreground">{empresa?.nome}</span>
              <span className="block truncate text-xs text-muted-foreground">{user?.nome}</span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-bold text-foreground">{user?.nome}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setProfileOpen(true)}>
              <UserRound className="size-4" />
              Meu perfil
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setRestoreOpen(true)}>
              <RotateCcw className="size-4" />
              Restaurar dados de demonstração
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                authService.logout();
                navigate("/login");
              }}
            >
              <LogOut className="size-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.95rem] font-semibold transition-colors",
                isActive ? "bg-sidebar-accent text-primary" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )
            }
          >
            <item.icon className="size-[1.15rem]" strokeWidth={1.9} />
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[0.7rem] font-bold text-primary-foreground">
                {item.badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Meu perfil</DialogTitle>
            <DialogDescription>Dados da usuária de demonstração.</DialogDescription>
          </DialogHeader>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-muted-foreground">Nome</dt><dd className="mt-0.5 font-semibold">{user?.nome}</dd></div>
            <div><dt className="text-muted-foreground">Cargo</dt><dd className="mt-0.5 font-semibold">{user?.cargo}</dd></div>
            <div className="col-span-2"><dt className="text-muted-foreground">E-mail</dt><dd className="mt-0.5 font-semibold">{user?.email}</dd></div>
            <div className="col-span-2"><dt className="text-muted-foreground">Empresa</dt><dd className="mt-0.5 font-semibold">{empresa?.nome}</dd></div>
          </dl>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="Restaurar dados de demonstração?"
        description="Tudo volta ao estado inicial: colaboradores, atualizações, conferências e histórico. Alterações feitas nos testes serão perdidas."
        confirmLabel="Restaurar dados"
        destructive
        onConfirm={() => {
          authService.restoreDemoData();
          toast.success("Dados de demonstração restaurados.");
          navigate("/");
        }}
      />
    </aside>
  );
}
