import type { Process } from "@graphs/types";

export type ProcessTableProps = {
  processes: Process[];
  updatedAt: number | null;
};

const fmt = (n: number) => n.toFixed(1).padStart(5, " ");
const pid = (n: number) => String(n).padStart(6, " ");

export function ProcessTable({ processes, updatedAt }: ProcessTableProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-xs uppercase tracking-widest text-primary">
          top processes
        </span>
        <span className="text-xs text-muted-foreground">
          {updatedAt
            ? `updated ${new Date(updatedAt).toLocaleTimeString()}`
            : "waiting..."}
        </span>
      </div>

      <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-4 px-4 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>pid</span>
        <span>name</span>
        <span className="text-right">cpu%</span>
        <span className="text-right">mem%</span>
      </div>

      <div className="flex-1 divide-y divide-border overflow-auto font-mono text-sm">
        {processes.length === 0 && (
          <div className="px-4 py-6 text-center text-muted-foreground">
            No data yet
          </div>
        )}
        {processes.map((p, i) => (
          <div
            key={`${p.pid}-${i}`}
            className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-4 px-4 py-1.5 hover:bg-muted"
          >
            <span className="text-muted-foreground">{pid(p.pid)}</span>
            <span className="truncate text-foreground">{p.name}</span>
            <span
              className={`text-right ${
                p.cpu > 20
                  ? "text-primary"
                  : p.cpu > 5
                  ? "text-accent"
                  : "text-muted-foreground"
              }`}
            >
              {fmt(p.cpu)}
            </span>
            <span className="text-right text-muted-foreground">
              {fmt(p.memory)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}