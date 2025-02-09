import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function MarketTrendChart({ ledgerData }) {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (ledgerData && ledgerData.result && ledgerData.result.ledger) {
      const transactions = ledgerData.result.ledger.transactions || [];
      const labels = transactions.map((_, idx) => `Tx ${idx + 1}`);
      // Simulasi data grafik: sesuaikan logika sesuai data real
      const dataPoints = transactions.map(() => Math.floor(Math.random() * 10) + 5);
      setChartData({
        labels,
        datasets: [{
          label: 'Transaction Activity',
          data: dataPoints,
          fill: true,
          borderColor: '#00c6ff',
          backgroundColor: 'rgba(0,198,255,0.3)',
          tension: 0.4,
        }],
      });
    } else {
      setChartData({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Transaction Volume',
          data: [5, 15, 8, 22, 18, 10],
          fill: true,
          borderColor: '#00c6ff',
          backgroundColor: 'rgba(0,198,255,0.3)',
          tension: 0.4,
        }],
      });
    }
  }, [ledgerData]);

  const options = {
    responsive: true,
    plugins: {
      legend: { labels: { color: 'white' } },
      title: { display: true, text: 'Market Trend Analysis', color: 'white' },
    },
    scales: {
      x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
      y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
    },
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg shadow-xl">
      {chartData ? <Line data={chartData} options={options} /> : (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-futuristic-accent"></div>
        </div>
      )}
    </div>
  );
}
