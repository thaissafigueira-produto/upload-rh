import { PawPrint } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { Wordmark } from "@/components/common/Wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEMO_USUARIO } from "@/data/seed";
import { authService } from "@/services/authService";
import { useDatabase } from "@/services/database";

export default function Login() {
  useDatabase();
  const navigate = useNavigate();

  const user = authService.currentUser();
  if (user) return <Navigate to={user.perfil === "guapeco" ? "/guapeco" : "/"} replace />;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-sidebar px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Wordmark className="text-4xl" />
          <p className="text-sm font-medium text-muted-foreground">Gestão da base de colaboradores</p>
        </div>
        <form
          className="rounded-3xl border border-sidebar-border bg-white p-8 shadow-[0_2px_12px_rgba(45,30,90,0.06)]"
          onSubmit={(e) => {
            e.preventDefault();
            authService.login();
            navigate("/");
          }}
        >
          <h1 className="text-2xl font-bold text-foreground">Entrar na plataforma</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Gerencie a população de colaboradores da sua empresa.
          </p>

          <div className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">
              E-mail
              <Input type="email" defaultValue={DEMO_USUARIO.email} readOnly />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-foreground">
              Senha
              <Input type="password" defaultValue="demonstracao" readOnly />
            </label>
          </div>

          <Button type="submit" size="lg" className="mt-6 w-full">
            Entrar como RH da Venturus
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="mt-3 w-full"
            onClick={() => {
              authService.login("guapeco");
              navigate("/guapeco");
            }}
          >
            Entrar como equipe Guapeco
          </Button>

          <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <PawPrint className="mt-0.5 size-3.5 shrink-0 text-primary" />
            Login simulado para demonstração: os dados já vêm preenchidos e todos os colaboradores exibidos são fictícios.
          </p>
        </form>
      </div>
    </div>
  );
}
