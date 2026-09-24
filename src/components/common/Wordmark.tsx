import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return <span className={cn("text-[1.6rem] font-bold tracking-tight text-primary", className)}>Guapeco</span>;
}
