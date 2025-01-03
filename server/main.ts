/// <reference lib="deno.ns" />

import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { logger } from "hono/logger";
import { cors } from "hono/cors";

const app = new Hono();

app.use(logger());
app.use(cors());

app.get("/online", (c) => {
  return streamSSE(c, (w) => {
    // Send SSE
    w.writeSSE({
      data: JSON.stringify({
        date: Date.now(),
        counter: Math.floor(Math.random() * 100),
      }),
      event: "send-metric",
      id: Math.random().toString() + Math.random().toString(),
    });

    // Random interval metric
    const clear = setInterval(() => {
      w.writeSSE({
        data: JSON.stringify({
          date: Date.now(),
          counter: Math.floor(Math.random() * 100),
        }),
        event: "send-metric",
        id: Math.random().toString() + Math.random().toString(),
      });
    }, 1000);

    // Disconnect SSE
    w.onAbort(() => {
      clearInterval(clear);
      console.log("SSE aborted");
    });

    return new Promise<void>(() => {});
  });
});

Deno.serve(app.fetch);
