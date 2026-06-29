/// <reference lib="deno.ns" />

import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { Metric, Process, ProcessSnapshot, Types } from "@graphs/types";
import { serveStatic } from "hono/deno";

const app = new Hono();

app.use(logger());

app.use(
  "/static/*",
  serveStatic({
    root: "../frontend/dist",
    rewriteRequestPath: (path) => path.replace(/^\/static/, ""),
  })
);

app.use(
  "/assets/*",
  serveStatic({
    root: "../frontend/dist",
  })
);

app.use(cors());

const readCpuPercent = async (): Promise<number> => {
  const { code, stdout, stderr } = await new Deno.Command("top", {
    args: ["-bn1"],
  }).output();
  if (code !== 0) {
    console.error("top failed:", new TextDecoder().decode(stderr));
    return 0;
  }
  const text = new TextDecoder().decode(stdout);
  const match = text.match(/,\s*([\d.]+)\s*id/);
  if (!match) return 0;
  const idle = parseFloat(match[1]);
  return Math.max(0, Math.min(100, 100 - idle));
};

const readMemoryPercent = async (): Promise<number> => {
  const { code, stdout, stderr } = await new Deno.Command("free").output();
  if (code !== 0) {
    console.error("free failed:", new TextDecoder().decode(stderr));
    return 0;
  }
  const lines = new TextDecoder().decode(stdout).split("\n");
  const memLine = lines.find((l) => l.startsWith("Mem:"));
  if (!memLine) return 0;
  const parts = memLine.split(/\s+/);
  const total = Number(parts[1]);
  const used = Number(parts[2]);
  if (!total) return 0;
  return Math.max(0, Math.min(100, (used * 100) / total));
};

const getCurrentCounting = async (type: Types): Promise<Metric> => {
  const counter = type === "cpu"
    ? await readCpuPercent()
    : type === "memory"
    ? await readMemoryPercent()
    : Math.floor(Math.random() * 100);
  return { date: Date.now(), type, counter };
};

app.get("/online/:type", (c) => {
  const type = c.req.param("type") as Types;

  return streamSSE(c, async (w) => {
    const send = async () => {
      const metric = await getCurrentCounting(type);
      await w.writeSSE({
        data: JSON.stringify(metric),
        event: "send-metric",
        id: crypto.randomUUID(),
      });
    };

    await send();

    const clear = setInterval(send, 3000);

    w.onAbort(() => {
      clearInterval(clear);
      console.log("SSE aborted");
    });

    return new Promise<void>(() => {});
  });
});

const TOP_N = 10;

const listTopProcesses = async (): Promise<Process[]> => {
  const { code, stdout } = await new Deno.Command("ps", {
    args: [
      "-eo",
      "pid=,pcpu=,pmem=,comm=",
      "--sort=-pcpu",
      "--no-headers",
    ],
  }).output();

  if (code !== 0) return [];

  const text = new TextDecoder().decode(stdout);
  return text
    .trim()
    .split("\n")
    .slice(0, TOP_N)
    .map((line) => {
      const [pidStr, cpuStr, memStr, ...nameParts] = line.trim().split(/\s+/);
      return {
        pid: Number(pidStr),
        cpu: Number(cpuStr),
        memory: Number(memStr),
        name: nameParts.join(" "),
      };
    })
    .filter((p) => Number.isFinite(p.pid) && p.pid > 0);
};

app.get("/processes", (c) => {
  return streamSSE(c, async (w) => {
    const send = async () => {
      const processes = await listTopProcesses();
      const snapshot: ProcessSnapshot = { date: Date.now(), processes };
      await w.writeSSE({
        data: JSON.stringify(snapshot),
        event: "send-processes",
        id: crypto.randomUUID(),
      });
    };

    await send();

    const clear = setInterval(send, 3000);

    w.onAbort(() => {
      clearInterval(clear);
      console.log("Processes SSE aborted");
    });

    return new Promise<void>(() => {});
  });
});

Deno.serve({ port: 8000 }, app.fetch);