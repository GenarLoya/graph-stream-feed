/// <reference lib="deno.ns" />

import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { Metric, Types } from "@graphs/types";
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

const getCurrentCounting = (type: Types): Metric => {
  if (type === "cpu") {
    const memoryInfo = Deno.systemMemoryInfo();

    const usageTotal = memoryInfo.total - memoryInfo.free;
    const usagePercent = (usageTotal * 100) / memoryInfo.total;

    return {
      date: Date.now(),
      type: type,
      counter: usagePercent,
    };
  }

  return {
    date: Date.now(),
    type: type,
    counter: Math.floor(Math.random() * 100),
  };
};

app.get("/online/:type", (c) => {
  const type = c.req.param("type") as Types;

  return streamSSE(c, (w) => {
    // Send SSE
    const metric = getCurrentCounting(type);

    w.writeSSE({
      data: JSON.stringify(metric),
      event: "send-metric",
      id: Math.random().toString() + Math.random().toString(),
    });

    // Random interval metric
    const clear = setInterval(() => {
      const metric = getCurrentCounting(type);

      w.writeSSE({
        data: JSON.stringify(metric),
        event: "send-metric",
        id: Math.random().toString() + Math.random().toString(),
      });
    }, 3000);

    // Disconnect SSE
    w.onAbort(() => {
      clearInterval(clear);
      console.log("SSE aborted");
    });

    return new Promise<void>(() => {});
  });
});

Deno.serve({ port: 8000 }, app.fetch);
