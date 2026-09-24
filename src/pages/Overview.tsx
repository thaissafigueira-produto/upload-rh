import { AlertTriangle, ArrowRight, Building2, Clock, PawPrint, UploadCloud, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { MetricCard } from "@/components/common/MetricCard";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCompetencia, formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { authService } from "@/services/authService";
import { dashboardService, type AtencaoItem } from "@/services/dashboardService";
import { useDatabase } from "@/services/database";

function AtencaoCard({ item }: { item: AtencaoItem }) {
  let icon = <AlertTriangle className="size-5" />;
  let text = "";
  let cta = { label: "", to: "" };

  if (item.tipo === "conferencia") {
    icon = <Building2 className="size-5" />;
    text = `Conferência de CNPJs de ${formatCompetencia(item.conferencia.competencia)} pendente — prazo: ${formatDate(item.conferencia.prazo)}`;
    cta = { label: "Conferir CNPJs", to: `/cnpjs/conferencia/${item.conferencia.id}` };
  } else if (item.tipo === "nao_encontrados") {
    icon = <Users className="size-5" />;
    text = `${item.quantidade} ${item.quantidade === 1 ? "colaborador não foi encontrado" : "colaboradores não foram encontrados"} na última base`;
    cta = { label: "Revisar", to: "/colaboradores?status=nao_encontrado" };
  } else {
    icon = <Clock className="size-5" />;
    text = "Sua base foi atualizada há mais de 30 dias";
    cta = { label: "Atualizar base", to: "/atualizar-base" };
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-lilac-soft p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-primary">{icon}</span>
        <p className="text-base font-semibold text-foreground">{text}</p>
      </div>
      <Button asChild size="sm" className="shrink-0 self-start sm:self-auto">
        <Link to={cta.to}>{cta.label}</Link>
      </Button>
    </div>
  );
}

export default function Overview() {
  useDatabase();
  const user = authService.currentUser();
  const firstName = user?.nome.split(" ")[0] ?? "";
  const { naBase, novosUltimaAtualizacao, pendencias, latest, atencao } = dashboardService.overview();

  return (
    <div>
      <PageHeader title={`Olá, ${firstName} 👋`} subtitle="Gerencie a população de colaboradores da sua empresa." />

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-foreground">O que precisa da sua atenção</h2>
        {atencao.length > 0 ? (
          <div className="flex flex-col gap-3">
            {atencao.map((item) => <AtencaoCard key={item.tipo} item={item} />)}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl bg-success-soft p-4 text-base font-semibold text-success">
            <PawPrint className="size-5" />
            Tudo em dia por aqui. 🐾
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Colaboradores na base"
          value={formatNumber(naBase)}
          context={novosUltimaAtualizacao > 0 ? `+${novosUltimaAtualizacao} na última atualização` : "Nenhuma mudança na última atualização"}
        />
        <MetricCard
          label="Novos na última atualização"
          value={formatNumber(novosUltimaAtualizacao)}
          context={latest ? `Atualização de ${formatDate(latest.version.data)}` : undefined}
        />
        <Link to="/colaboradores?status=nao_encontrado" className="block rounded-2xl transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring">
          <MetricCard
            label="Pendências"
            value={formatNumber(pendencias)}
            context={pendencias > 0 ? "Colaboradores não encontrados na última base" : "Nenhuma pendência"}
          />
        </Link>
      </div>

      {latest && (
        <Card className="mt-6">
          <CardContent>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <h2 className="text-lg font-bold text-foreground">Última atualização</h2>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                {formatDateTime(latest.version.data)}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              por {latest.version.usuario} · {latest.version.arquivo}
            </p>
            <p className="mt-1 text-base font-semibold text-foreground">
              {formatNumber(latest.upload.total)} colaboradores processados
            </p>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm font-medium">
              <span className="text-success">{latest.upload.novos} novos</span>
              <span className="text-warning">{latest.upload.naoEncontrados} não encontrados</span>
              <span className="text-foreground">{latest.upload.alterados} alterados</span>
            </div>
            <Link
              to={`/historico/${latest.upload.id}`}
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
            >
              Ver detalhes
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <Button asChild size="lg">
          <Link to="/atualizar-base">
            <UploadCloud />
            Atualizar base
          </Link>
        </Button>
      </div>
    </div>
  );
}
