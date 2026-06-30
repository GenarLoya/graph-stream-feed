import { useSSE } from "../hooks/useSSE.tsx";
import { MetricChart } from "../components/MetricChart.tsx";
import { ProcessTable } from "../components/ProcessTable.tsx";
import type { Metric, ProcessSnapshot } from "@graphs/types";

const StatusDot = ({ ok }: { ok: boolean }) => (
  <span
    className={`inline-block h-2 w-2 ${
      ok ? "bg-primary" : "bg-destructive"
    } ${ok ? "animate-pulse" : ""}`}
  />
);

export default function Main() {
  const cpu = useSSE<Metric>({
    url: "/online/cpu",
    eventSSE: "send-metric",
    queryKey: ["metric", "cpu"],
    maxHistory: 60,
  });

  const mem = useSSE<Metric>({
    url: "/online/memory",
    eventSSE: "send-metric",
    queryKey: ["metric", "memory"],
    maxHistory: 60,
  });

  const processes = useSSE<ProcessSnapshot>({
    url: "/processes",
    eventSSE: "send-processes",
    queryKey: ["processes"],
    mode: "replace",
  });

  const cpuData = cpu.data ?? [];
  const memData = mem.data ?? [];
  const snapshot = processes.data?.[0];
  const procList = snapshot?.processes ?? [];

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 bg-background px-6 py-8 text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="cursor-blink text-xl font-bold text-primary">
            ~/sysmon
          </h1>
          <p className="text-xs text-muted-foreground">
            live system metrics · sse stream
          </p>
        </div>

        <div className="flex items-center gap-5 font-mono text-xs">
          <div className="flex items-center gap-2">
            <StatusDot ok={cpuData.length > 0} />
            <span className="text-muted-foreground">cpu</span>
            <span className="text-foreground">{cpuData.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot ok={memData.length > 0} />
            <span className="text-muted-foreground">mem</span>
            <span className="text-foreground">{memData.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot ok={procList.length > 0} />
            <span className="text-muted-foreground">procs</span>
            <span className="text-foreground">{procList.length}</span>
          </div>
        </div>
      </header>

      <div className="grid flex-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <section className="border border-border bg-card">
            <MetricChart
              data={cpuData}
              label="cpu%"
              unit="%"
              colorVar="--chart-1"
              height={280}
            />
          </section>
          <section className="border border-border bg-card">
            <MetricChart
              data={memData}
              label="memory%"
              unit="%"
              colorVar="--chart-2"
              height={280}
            />
          </section>
        </div>

        <section className="border border-border bg-card">
          <ProcessTable processes={procList} updatedAt={snapshot?.date ?? null} />
        </section>
      </div>
    </div>
  );
}