import { useEffect, useRef, useState } from 'react';

function App() {
  const [metric, setMetric] = useState(null);
  const canvasRef = useRef(null);
  const metrics = useRef([]); // Para guardar un historial de métricas.

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:8000/online');

    eventSource.addEventListener('send-metric', (event) => {
      const newMetric = JSON.parse(event.data).counter;
      setMetric(newMetric);

      // Agregar la nueva métrica al historial (máximo 50 puntos).
      metrics.current = [...metrics.current.slice(-49), newMetric];
      drawGraph();
    });

    eventSource.addEventListener('error', (event) => {
      console.log('Error:', event);
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Limpiar el canvas.
    ctx.clearRect(0, 0, width, height);

    // Dibujar ejes.
    ctx.strokeStyle = '#ccc';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.lineTo(width, 0);
    ctx.stroke();

    // Dibujar la gráfica.
    const maxMetric = Math.max(...metrics.current, 10); // Evitar divisor cero.
    const pointSpacing = width / 50; // Separación entre puntos.
    ctx.strokeStyle = 'blue';
    ctx.beginPath();
    metrics.current.forEach((value: number, index: number) => {
      const x = index * pointSpacing;
      const y = height - 20 - (value / maxMetric) * (height - 40);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Last metric value:</h1>
      {metric !== null ? (
        <h2>{metric}</h2>
      ) : (
        <p>Cargando datos...</p>
      )}
      <canvas
        ref={canvasRef}
        width={500}
        height={300}
        style={{
          border: '1px solid black',
          marginTop: '20px',
        }}
      ></canvas>
    </div>
  );
}

export default App;
