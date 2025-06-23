"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Download, BarChart3, PieChart, LineChart, AlertCircle } from "lucide-react"
import { getReportData, getDashboardSummary } from "./reportes-actions"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import ReporteGrafico from "./ReporteGrafico" // <-- IMPORTA EL NUEVO COMPONENTE

interface ReporteItem {
  [key: string]: any
}

export default function ReportesPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [reportType, setReportType] = useState<"ventas" | "productos" | "clientes" | "categorias">("ventas")
  const [period, setPeriod] = useState("dia")
  const [activeTab, setActiveTab] = useState('tabla');

  const [tableData, setTableData] = useState<ReporteItem[]>([])
  const [summaryData, setSummaryData] = useState<any>(null)

  const [isTableLoading, setIsTableLoading] = useState(false)
  const [isSummaryLoading, setIsSummaryLoading] = useState(false)

  const fetchTableData = useCallback(async () => {
    setIsTableLoading(true)
    try {
      const data = await getReportData(reportType, period, date || new Date())
      setTableData(data)
    } catch (error) {
      toast.error("Error al generar el reporte de tabla.")
    } finally {
      setIsTableLoading(false)
    }
  }, [reportType, period, date]);

  const fetchSummaryData = useCallback(async () => {
    setIsSummaryLoading(true)
    try {
      const data = await getDashboardSummary(period, date || new Date())
      setSummaryData(data)
    } catch (error) {
      toast.error("Error al generar el resumen.")
    } finally {
      setIsSummaryLoading(false)
    }
  }, [period, date]);

  useEffect(() => {
    // Si la pestaña de tabla o gráfico está activa, carga los datos detallados
    if (activeTab === 'tabla' || activeTab === 'grafico') {
      fetchTableData()
    }
    // Si la pestaña de resumen está activa, carga los datos del resumen
    if (activeTab === 'resumen') {
      fetchSummaryData()
    }
  }, [activeTab, reportType, period, date, fetchTableData, fetchSummaryData])


  const headers = useMemo(() => {
    if (tableData.length === 0) return []
    return Object.keys(tableData[0])
  }, [tableData])

  const formatHeader = (header: string) => {
    return header.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const formatCellValue = (value: any) => {
    if (typeof value === 'number') {
      if (String(value).includes('.')) return `$${value.toFixed(2)}`
      return value
    }
    return value
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-amber-900">Reportes</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 border rounded-lg bg-white items-end">
        <div className="w-full md:w-1/3 space-y-2">
          <Label htmlFor="reportType">Tipo de Reporte</Label>
          <Select value={reportType} onValueChange={(value) => setReportType(value as any)}>
            <SelectTrigger id="reportType" className="border-amber-200"><SelectValue placeholder="Tipo de reporte" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ventas">Ventas</SelectItem>
              <SelectItem value="productos">Productos</SelectItem>
              <SelectItem value="clientes">Clientes</SelectItem>
              <SelectItem value="categorias">Categorías</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-1/3 space-y-2">
          <Label htmlFor="period">Período</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger id="period" className="border-amber-200"><SelectValue placeholder="Período" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="dia">Día</SelectItem>
              <SelectItem value="semana">Semana</SelectItem>
              <SelectItem value="mes">Mes</SelectItem>
              <SelectItem value="año">Año</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-1/3 space-y-2">
          <Label>Fecha de Referencia</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal border-amber-200", !date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
          </Popover>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="tabla"><LineChart className="h-4 w-4 mr-2" />Tabla Detallada</TabsTrigger>
          <TabsTrigger value="resumen"><PieChart className="h-4 w-4 mr-2" />Resumen General</TabsTrigger>
          <TabsTrigger value="grafico"><BarChart3 className="h-4 w-4 mr-2" />Gráfico</TabsTrigger>
        </TabsList>

        <TabsContent value="tabla">
            <Card>
                <CardHeader><CardTitle className="text-amber-800">Reporte Detallado</CardTitle><CardDescription>Utiliza el filtro "Tipo de Reporte" para cambiar la vista.</CardDescription></CardHeader>
                <CardContent>
                {isTableLoading ? (<div className="text-center py-8">Cargando datos...</div>
                ) : tableData.length === 0 ? (<div className="text-center py-8 text-gray-500"><AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-20" /><p>No hay datos para mostrar.</p></div>
                ) : (
                    <div className="border rounded-md overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-amber-50"><tr>{headers.map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{formatHeader(h)}</th>)}</tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">{tableData.map((item, index) => (<tr key={index}>{headers.map((h) => <td key={h} className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatCellValue(item[h])}</td>)}</tr>))}</tbody>
                    </table>
                    </div>
                )}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="resumen">
          <Card>
            <CardHeader><CardTitle className="text-amber-800">Resumen General del Período</CardTitle><CardDescription>Vista consolidada de los indicadores clave.</CardDescription></CardHeader>
            <CardContent>
            {isSummaryLoading ? (<div className="text-center py-8">Cargando resumen...</div>
            ) : !summaryData ? (<div className="text-center py-8 text-gray-500"><AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-20" /><p>No hay datos suficientes para el resumen.</p></div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Resumen de Ventas</CardTitle><CardDescription>Datos acumulados del período.</CardDescription></CardHeader>
                            <CardContent><dl className="space-y-2 text-sm">
                                <div className="flex justify-between"><dt className="text-gray-600">Total de ventas:</dt><dd className="font-semibold">${summaryData.ventas.totalVentas.toFixed(2)}</dd></div>
                                <div className="flex justify-between"><dt className="text-gray-600">Promedio por orden:</dt><dd className="font-semibold">${summaryData.ventas.promedioPorOrden.toFixed(2)}</dd></div>
                                <div className="flex justify-between"><dt className="text-gray-600">Día con más ventas:</dt><dd className="font-semibold">{summaryData.ventas.diaMasVentas}</dd></div>
                                <div className="flex justify-between"><dt className="text-gray-600">Productos vendidos:</dt><dd className="font-semibold">{summaryData.ventas.productosVendidos} und.</dd></div>
                            </dl></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Mejores Clientes</CardTitle><CardDescription>Clientes con más compras o visitas.</CardDescription></CardHeader>
                            <CardContent><ol className="space-y-3">{summaryData.clientes.map((c: any, i: number) => (<li key={i} className="flex justify-between text-sm"><span>{i + 1}. {c.nombre}</span><span className="font-semibold">{c.visitas} visitas (${c.total.toFixed(2)})</span></li>))}</ol></CardContent>
                        </Card>
                    </div>
                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Mejores Productos</CardTitle><CardDescription>Productos más vendidos por cantidad.</CardDescription></CardHeader>
                            <CardContent><ol className="space-y-3">{summaryData.productos.map((p: any, i: number) => (<li key={i} className="flex justify-between text-sm"><span>{i + 1}. {p.nombre}</span><span className="font-semibold">${p.total.toFixed(2)}</span></li>))}</ol></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Categorías Populares</CardTitle><CardDescription>Ventas por categoría.</CardDescription></CardHeader>
                            <CardContent><ol className="space-y-3">{summaryData.categorias.map((cat: any, i: number) => (<li key={i} className="flex justify-between text-sm"><span>{i + 1}. {cat.categoria}</span><span className="font-semibold">${cat.total.toFixed(2)}</span></li>))}</ol></CardContent>
                        </Card>
                    </div>
                </div>
            )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grafico">
          <Card>
            <CardHeader><CardTitle className="text-amber-800">Visualización de Datos</CardTitle><CardDescription>Gráfico interactivo basado en el tipo de reporte seleccionado.</CardDescription></CardHeader>
            <CardContent>
                {isTableLoading ? (
                     <div className="flex items-center justify-center h-full min-h-[350px]">Cargando gráfico...</div>
                ) : (
                    <ReporteGrafico data={tableData} reportType={reportType} />
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}