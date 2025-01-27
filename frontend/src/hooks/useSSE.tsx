import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

export function useSSE<T>({
    url,
    eventSSE,
    queryKey,
    maxHistory = null,
}: {
    url: string;
    eventSSE: string;
    queryKey: unknown[];
    maxHistory?: number | null;
}) {

    const queryClient = useQueryClient();
    const memoizedQueryKey = useMemo(() => JSON.stringify(queryKey), [JSON.stringify(queryKey)]);

    const query = useQuery<T[]>({
        queryKey: queryKey,
        initialData: [],
    })

    useEffect(() => {
        console.log(queryKey)
        const eventSource = new EventSource(url);

        eventSource.addEventListener(eventSSE, (event) => {
            const newData = JSON.parse(event.data);
            queryClient.setQueryData<T[]>(queryKey, (o: T[] | undefined) => {
                if (o === undefined) {
                    return [newData];
                }

                if (maxHistory !== null && o.length > maxHistory) {
                    return [...o.slice(-maxHistory), newData];
                }

                return [...o, newData];
            });
        });

        eventSource.addEventListener('error', (event) => {
            console.log('Error:', event);
        });

        return () => {
            eventSource.close();
        };
    }, [memoizedQueryKey, url]);

    return query;
}