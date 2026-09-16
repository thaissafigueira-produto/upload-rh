import { ArrowRight, Clock, UploadCloud, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDateTime, formatNumber } from "@/lib/format";
import { useStore } from "@/lib/store";

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default function Overview() {
  const { user, employees, versions } = useStore();
  const firstName = user?.nome.split(" ")[0] ?? "";

  const colaboradoresNaBase = employees.filter((e) => e.status === "ativo").length;
  const pendencias = employees.filter((e) => e.status === "ativo" && e.naoEncontradoNaUltimaBase).length;
  const ultimaVersao = versions[versions.length - 1];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Olá, {firstName} 👋</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Gerencie a população de colaboradores da sua empresa.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Colaboradores na base" value={formatNumber(colaboradoresNaBase)} />
        <MetricCard
          label="Novos na última atualização"
          value={ultimaVersao ? formatNumber(ultimaVersao.novos) : "0"}
        />
        <MetricCard
          label="Pendências"
          value={formatNumber(pendencias)}
          hint={pendencias > 0 ? "Colaboradores não encontrados na última base" : undefined}
        />
      </div>

      {ultimaVersao && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Última atualização</p>
            </div>
            <Badge variant="secondary" className="font-normal">
              {formatDateTime(ultimaVersao.data)}
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {formatNumber(ultimaVersao.total)} colaboradores processados
            </p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
              <span className="text-success">+{ultimaVersao.novos} adicionados</span>
              <span className="text-muted-foreground">−{ultimaVersao.removidos} removidos</span>
              <span className="text-foreground">{ultimaVersao.alterados} atualizados</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link to={`/historico?v=${ultimaVersao.id}`}>
                  Ver detalhes
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild>
                <Link to="/atualizar-base">
                  <UploadCloud className="size-4" />
                  Atualizar base
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6 border-dashed">
        <CardContent className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft">
              <Users className="size-5 text-brand" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Consulte a base de colaboradores</p>
              <p className="text-sm text-muted-foreground">Busque, filtre e acompanhe a população elegível.</p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link to="/colaboradores">Ver colaboradores</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
