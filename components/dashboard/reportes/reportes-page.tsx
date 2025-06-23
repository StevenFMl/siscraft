"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Download, BarChart3, PieChart, LineChart } from "lucide-react"

export default function ReportesPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [reportType, setReportType] = useState("ventas")
  const [period, setPeriod] = useState("dia")

  // Datos de ejemplo para los reportes
  const ventasPorDia = [
    { fecha: "2023-05-01", total: 1250 },
    { fecha: "2023-05-02", total: 980 },
    { fecha: "2023-05-03", total: 1100 },
    { fecha: "2023-05-04", total: 1300 },
    { fecha: "2023-05-05", total: 1500 },
    { fecha: "2023-05-06", total: 1800 },
    { fecha: "2023-05-07", total: 1200 },
  ]

  const ventasPorCategoria = [
    { categoria: "Café Caliente", total: 3500 },
    { categoria: "Café Frío", total: 2800 },
    { categoria: "Tés", total: 1200 },
    { categoria: "Pastelería", total: 2500 },
    { categoria: "Sándwiches", total: 1800 },
  ]

  const productosMasVendidos = [
    { nombre: "Café Americano", cantidad: 120, total: 300 },
    { nombre: "Cappuccino", cantidad: 85, total: 297.5 },
    { nombre: "Café Latte", cantidad: 78, total: 273 },
    { nombre: "Frappuccino", cantidad: 65, total: 292.5 },
    { nombre: "Croissant", cantidad: 60, total: 120 },
  ]

  const clientesFrecuentes = [
    { nombre: "Juan Pérez", visitas: 15, total: 450 },
    { nombre: "María García", visitas: 12, total: 380 },
    { nombre: "Carlos López", visitas: 10, total: 320 },
    { nombre: "Ana Martínez", visitas: 8, total: 280 },
    { nombre: "Roberto Sánchez", visitas: 7, total: 210 },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-amber-900">Reportes</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-1/3">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="border-amber-200">
              <SelectValue placeholder="Tipo de reporte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ventas">Ventas</SelectItem>
              <SelectItem value="productos">Productos</SelectItem>
              <SelectItem value="clientes">Clientes</SelectItem>
              <SelectItem value="categorias">Categorías</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-1/3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="border-amber-200">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dia">Día</SelectItem>
              <SelectItem value="semana">Semana</SelectItem>
              <SelectItem value="mes">Mes</SelectItem>
              <SelectItem value="año">Año</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-1/3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal border-amber-200",
                  !date && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Tabs defaultValue="grafico" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="grafico">
            <BarChart3 className="h-4 w-4 mr-2" />
            Gráfico
          </TabsTrigger>
          <TabsTrigger value="tabla">
            <LineChart className="h-4 w-4 mr-2" />
            Tabla
          </TabsTrigger>
          <TabsTrigger value="resumen">
            <PieChart className="h-4 w-4 mr-2" />
            Resumen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grafico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-amber-800">
                {reportType === "ventas"
                  ? "Ventas por Período"
                  : reportType === "productos"
                    ? "Productos Más Vendidos"
                    : reportType === "clientes"
                      ? "Clientes Frecuentes"
                      : "Ventas por Categoría"}
              </CardTitle>
              <CardDescription>Visualización de datos para el período seleccionado</CardDescription>
            </CardHeader>
            <CardContent className="h-80 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Aquí se mostraría el gráfico correspondiente</p>
                <p className="text-sm">Datos de ejemplo para demostración</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tabla" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-amber-800">
                    {reportType === "ventas"
                      ? "Ventas por Día"
                      : reportType === "productos"
                        ? "Productos Más Vendidos"
                        : reportType === "clientes"
                          ? "Clientes Frecuentes"
                          : "Ventas por Categoría"}
                  </CardTitle>
                  <CardDescription>Datos detallados para el período seleccionado</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-amber-50">
                    <tr>
                      {reportType === "ventas" && (
                        <>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </>
                      )}
                      {reportType === "productos" && (
                        <>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Producto
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cantidad
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </>
                      )}
                      {reportType === "clientes" && (
                        <>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cliente
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Visitas
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </>
                      )}
                      {reportType === "categorias" && (
                        <>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Categoría
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportType === "ventas" &&
                      ventasPorDia.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item.fecha}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium">
                            ${item.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    {reportType === "productos" &&
                      productosMasVendidos.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item.nombre}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-center">{item.cantidad}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium">
                            ${item.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    {reportType === "clientes" &&
                      clientesFrecuentes.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item.nombre}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-center">{item.visitas}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium">
                            ${item.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    {reportType === "categorias" &&
                      ventasPorCategoria.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">{item.categoria}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium">
                            ${item.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resumen" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-amber-800">Resumen de Ventas</CardTitle>
                <CardDescription>Datos acumulados del período</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Total de ventas:</dt>
                    <dd className="text-sm font-bold">
                      ${ventasPorDia.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Promedio diario:</dt>
                    <dd className="text-sm font-bold">
                      ${(ventasPorDia.reduce((sum, item) => sum + item.total, 0) / ventasPorDia.length).toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Día con más ventas:</dt>
                    <dd className="text-sm font-bold">
                      {ventasPorDia.reduce((max, item) => (item.total > max.total ? item : max), ventasPorDia[0]).fecha}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Productos vendidos:</dt>
                    <dd className="text-sm font-bold">
                      {productosMasVendidos.reduce((sum, item) => sum + item.cantidad, 0)}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-amber-800">Mejores Productos</CardTitle>
                <CardDescription>Productos más vendidos</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {productosMasVendidos.slice(0, 3).map((item, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <span className="text-sm">
                        <span className="font-medium">{index + 1}.</span> {item.nombre}
                      </span>
                      <span className="text-sm font-bold">${item.total.toFixed(2)}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-amber-800">Categorías Populares</CardTitle>
                <CardDescription>Ventas por categoría</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {ventasPorCategoria
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 3)
                    .map((item, index) => (
                      <li key={index} className="flex justify-between items-center">
                        <span className="text-sm">
                          <span className="font-medium">{index + 1}.</span> {item.categoria}
                        </span>
                        <span className="text-sm font-bold">${item.total.toFixed(2)}</span>
                      </li>
                    ))}
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-amber-800">Mejores Clientes</CardTitle>
                <CardDescription>Clientes con más compras</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {clientesFrecuentes.slice(0, 3).map((item, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <span className="text-sm">
                        <span className="font-medium">{index + 1}.</span> {item.nombre}
                      </span>
                      <span className="text-sm font-bold">${item.total.toFixed(2)}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
