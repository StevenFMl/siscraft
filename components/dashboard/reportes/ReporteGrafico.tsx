// components/dashboard/reportes/ReporteGrafico.tsx

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AlertCircle } from "lucide-react";

interface ReporteGraficoProps {
  data: any[];
  reportType: "ventas" | "productos" | "clientes" | "categorias";
}

// Colores de la paleta de tu aplicación para los gráficos
const COLORS = [
  "#78350f",
  "#b45309",
  "#d97706",
  "#f59e0b",
  "#fbbf24",
  "#fcd34d",
];

export default function ReporteGrafico({
  data,
  reportType,
}: ReporteGraficoProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full min-h-[350px] flex-col items-center justify-center text-center text-gray-500">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p>No hay datos disponibles para mostrar en el gráfico.</p>
        <p className="text-sm">Intenta con otros filtros.</p>
      </div>
    );
  }

  const renderChart = () => {
    switch (reportType) {
      case "ventas":
        return (
          <BarChart
            data={data}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="fecha"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fffbeb",
                border: "1px solid #fde68a",
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Total"]}
            />
            <Bar
              dataKey="total"
              fill="#b45309"
              radius={[4, 4, 0, 0]}
              name="Venta Total"
            />
          </BarChart>
        );

      case "productos":
        return (
          <BarChart
            data={data.slice(0, 10)}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="nombre"
              width={150}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fffbeb",
                border: "1px solid #fde68a",
              }}
              formatter={(value: number) => [value, "Cantidad"]}
            />
            <Bar
              dataKey="cantidad"
              fill="#d97706"
              radius={[0, 4, 4, 0]}
              name="Cantidad Vendida"
            />
          </BarChart>
        );

      case "clientes":
        return (
          <BarChart
            data={data.slice(0, 10)}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="nombre"
              angle={-10}
              textAnchor="end"
              height={60}
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              stroke="#78350f"
              fontSize={12}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#f59e0b"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fffbeb",
                border: "1px solid #fde68a",
              }}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="visitas"
              fill="#78350f"
              radius={[4, 4, 0, 0]}
              name="Visitas"
            />
            <Bar
              yAxisId="right"
              dataKey="total"
              fill="#f59e0b"
              radius={[4, 4, 0, 0]}
              name="Gasto ($)"
            />
          </BarChart>
        );

      case "categorias":
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="categoria"
              cx="50%"
              cy="50%"
              outerRadius={120}
              fill="#8884d8"
              labelLine={false}
              label={({
                cx,
                cy,
                midAngle,
                innerRadius,
                outerRadius,
                percent,
                index,
              }) => {
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                return (
                  <text
                    x={x}
                    y={y}
                    fill="white"
                    textAnchor={x > cx ? "start" : "end"}
                    dominantBaseline="central"
                    fontSize={12}
                  >
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name) => [
                `$${value.toFixed(2)}`,
                name,
              ]}
            />
            <Legend />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      {renderChart()}
    </ResponsiveContainer>
  );
}
