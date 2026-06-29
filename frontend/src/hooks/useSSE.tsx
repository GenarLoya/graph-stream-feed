import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

export type SSEMode = "append" | "replace";

export function useSSE<T>({
  url,
  eventSSE,
  queryKey,
  maxHistory = null,
  mode = "append",
}: {
  url: string;
  eventSSE: string;
  queryKey: unknown[];
  maxHistory?: number | null;
  mode?: SSEMode;
}) {
  const queryClient = useQueryClient();
  const memoizedQueryKey = useMemo(
    () => JSON.stringify(queryKey),
    [JSON.stringify(queryKey)],
  );

  const query = useQuery<T[]>({
    queryKey,
    initialData: [],
  });

  useEffect(() => {
    const eventSource = new EventSource(url);

    eventSource.addEventListener(eventSSE, (event) => {
      const newData = JSON.parse(event.data) as T;
      queryClient.setQueryData<T[]>(queryKey, (o: T[] | undefined) => {
        if (mode === "replace") return [newData];

        if (o === undefined) return [newData];

        if (maxHistory !== null && o.length >= maxHistory) {
          return [...o.slice(-(maxHistory - 1)), newData];
        }

        return [...o, newData];
      });
    });

    eventSource.addEventListener("error", (event) => {
      console.log("SSE error:", event);
    });

    return () => {
      eventSource.close();
    };
  }, [memoizedQueryKey, url, mode, maxHistory]);

  return query;
}