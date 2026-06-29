# Graph Stream Feed — Monitor de Sistema

Monitor de sistema en vivo transmitido por **Server-Sent Events (SSE)**. Un
backend en Deno + Hono toma muestras de CPU%, memoria% y los procesos más
activos del host (`top`, `free`, `ps`) y las envía al navegador en tiempo
real. El frontend en React renderiza gráficos de líneas con historial
acotado y una tabla de procesos en vivo.

## Stack

- **Backend**: Deno + Hono, SSE vía `hono/streaming`
- **Frontend**: Vite + React 18 + TypeScript, TanStack Query, Recharts, Tailwind
- **Tipos compartidos**: paquete del workspace de Deno
- **Orquestación de dev**: [Spino](https://jsr.io/@rsm-hcd/spino)

## Estructura del workspace

```
.
├── server/    # App Hono — endpoints SSE en el puerto 8000
├── frontend/  # SPA Vite — gráficos + tabla de procesos
└── types/     # Tipos TS compartidos (Metric, Process, ProcessSnapshot)
```

## Ejecución

```bash
deno install
deno task dev
```

Spino corre los tasks de dev de `server/` y `frontend/` en paralelo. El
backend escucha en `http://localhost:8000`; el dev server del frontend
proxifica las requests SSE hacia él.

### Build de producción

```bash
# Compila el bundle del frontend en frontend/dist
deno task -f frontend build

# Sirve los assets compilados + endpoints SSE desde el server Hono
deno task -f server start
```

El server de Hono ya tiene `serveStatic` configurado contra `frontend/dist`
en `/static/*` y `/assets/*`.

## Endpoints

| Método | Path             | Descripción                       | Evento          |
| ------ | ---------------- | --------------------------------- | --------------- |
| GET    | `/online/cpu`    | SSE — muestra de CPU% cada 3s     | `send-metric`   |
| GET    | `/online/memory` | SSE — muestra de memoria% cada 3s | `send-metric`   |
| GET    | `/processes`     | SSE — top 10 procesos cada 3s     | `send-processes`|
| GET    | `/static/*`      | Assets compilados del frontend    | —               |
| GET    | `/assets/*`      | Assets compilados del frontend    | —               |

## Cómo funciona el stream

- El server invoca `top -bn1`, `free` y `ps` para leer las métricas del host.
- Cada métrica se escribe en su stream SSE como un evento JSON tipado.
- El hook del frontend `useSSE<T>` abre un `EventSource` por stream, agrega
  al historial acotado (default 60 puntos) o reemplaza el valor (procesos),
  y lo guarda en el cache de TanStack Query para que lo consuman los
  componentes.

## Modelo de datos

```ts
type Metric = { date: number; type: "cpu" | "memory"; counter: number };
type Process = { pid: number; name: string; cpu: number; memory: number };
type ProcessSnapshot = { date: number; processes: Process[] };
```
