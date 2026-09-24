import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({ label, value, context }: { label: string; value: string; context?: ReactNode }) {
  return (
    <Card className="h-full">
      <CardContent>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 text-4xl font-bold tracking-tight text-foreground">{value}</p>
        {context && <p className="mt-1.5 text-sm text-muted-foreground">{context}</p>}
      </CardContent>
    </Card>
  );
}
