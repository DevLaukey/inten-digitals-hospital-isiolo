"use client";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import { formatMoney } from "@/lib/format";

const BAR_COLOR = "#0d9488"; // brand-600
const GRID_COLOR = "#f1f5f9"; // slate-100
const TICK_COLOR = "#64748b"; // slate-500

const compact = new Intl.NumberFormat("en-KE", { notation: "compact" });

const OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      displayColors: false,
      callbacks: { label: (context) => formatMoney(context.parsed.y) },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: TICK_COLOR } },
    y: {
      beginAtZero: true,
      border: { display: false },
      grid: { color: GRID_COLOR },
      ticks: { color: TICK_COLOR, maxTicksLimit: 5, callback: (value) => compact.format(value) },
    },
  },
};

// rows: [{ label, value }]
export default function CollectedChart({ rows }) {
  const data = {
    labels: rows.map((row) => row.label),
    datasets: [
      {
        data: rows.map((row) => row.value),
        backgroundColor: BAR_COLOR,
        hoverBackgroundColor: "#0f766e",
        borderRadius: { topLeft: 4, topRight: 4 },
        borderSkipped: "bottom",
        maxBarThickness: 36,
      },
    ],
  };
  return (
    <>
      <div className="h-64">
        <Bar data={data} options={OPTIONS} aria-hidden />
      </div>
      <table className="sr-only">
        <caption>Money collected per day</caption>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{formatMoney(row.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
