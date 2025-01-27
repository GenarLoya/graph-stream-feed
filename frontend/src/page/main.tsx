import { useSSE } from "../hooks/useSSE.tsx";
import { Metric, typesList } from "@graphs/types";
import { useState } from "react";

export default function Main() {
    const [type, setType] = useState<string>('counter');

    const query = useSSE<Metric>({
        url: 'http://localhost:8000/online/' + type,
        eventSSE: 'send-metric',
        queryKey: ['metric', {
            type: type,
        }],
        maxHistory: 50,
    });

    return (
        <div style={{ textAlign: 'center' }}>
            <h1>Last metric value:</h1>
            <button
                onClick={() => setType(typesList.counter)}
            >Counter</button>
            <button
                onClick={() => setType(typesList.cpu)}
            >CPU</button>
            <h2>Loading...</h2>
            <h1>Type: {type}</h1>
            <ul>
                {query.data?.map?.((metric) => (
                    <li key={metric.date}>
                        {metric.date} - {metric.counter}
                    </li>
                ))}
            </ul>
        </div>
    )
}