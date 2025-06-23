"use server"

import { createClient } from "@/utils/supabase/server"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'

interface ReporteItem {
  [key: string]: any
}

const getDateRange = (period: string, date: Date) => {
  const d = date ? new Date(date) : new Date()
  switch (period) {
    case 'dia': return { gte: startOfDay(d).toISOString(), lte: endOfDay(d).toISOString() }
    case 'semana': return { gte: startOfWeek(d).toISOString(), lte: endOfWeek(d).toISOString() }
    case 'mes': return { gte: startOfMonth(d).toISOString(), lte: endOfMonth(d).toISOString() }
    case 'año': return { gte: startOfYear(d).toISOString(), lte: endOfYear(d).toISOString() }
    default: return { gte: startOfDay(d).toISOString(), lte: endOfDay(d).toISOString() }
  }
}

// SIN USAR RPC
export async function getReportData(reportType: string, period: string, date: Date): Promise<ReporteItem[]> {
  const supabase = await createClient()
  const { gte, lte } = getDateRange(period, date)

  try {
    if (reportType === 'ventas') {
      const { data, error } = await supabase.from('ordenes').select('fecha_orden, total').eq('estado', 'completada').gte('fecha_orden', gte).lte('fecha_orden', lte).order('fecha_orden', { ascending: true })
      if (error) throw error
      return data.map(item => ({ fecha: new Date(item.fecha_orden).toLocaleDateString('es-EC'), total: item.total }))
    }

    if (reportType === 'productos') {
        const { data, error } = await supabase.from('detalles_orden').select('cantidad, subtotal, productos!inner(nombre), ordenes!inner(fecha_orden, estado)').eq('ordenes.estado', 'completada').gte('ordenes.fecha_orden', gte).lte('ordenes.fecha_orden', lte);
        if (error) throw error;
        const productSales = Object.values(data.reduce((acc, detalle) => {
            const name = detalle.productos.nombre;
            if (!acc[name]) acc[name] = { nombre: name, cantidad: 0, total: 0 };
            acc[name].cantidad += detalle.cantidad;
            acc[name].total += detalle.subtotal;
            return acc;
        }, {} as { [key: string]: { nombre: string, cantidad: number, total: number } }));
        return productSales.sort((a, b) => b.cantidad - a.cantidad);
    }

    if (reportType === 'clientes') {
        const { data, error } = await supabase.from('ordenes').select('total, clientes!inner(id, nombre, apellido)').eq('estado', 'completada').gte('fecha_orden', gte).lte('fecha_orden', lte);
        if (error) throw error;
        const customerData = Object.values(data.reduce((acc, orden) => {
            const id = orden.clientes.id;
            const name = `${orden.clientes.nombre} ${orden.clientes.apellido || ''}`.trim();
            if (!acc[id]) acc[id] = { nombre: name, visitas: 0, total: 0 };
            acc[id].visitas += 1;
            acc[id].total += orden.total;
            return acc;
        }, {} as { [key: string]: { nombre: string, visitas: number, total: number } }));
        return customerData.sort((a, b) => b.visitas - a.visitas);
    }

    if (reportType === 'categorias') {
        const { data, error } = await supabase.from('detalles_orden').select('subtotal, productos!inner(categorias!inner(nombre)), ordenes!inner(fecha_orden, estado)').eq('ordenes.estado', 'completada').gte('ordenes.fecha_orden', gte).lte('ordenes.fecha_orden', lte);
        if (error) throw error;
        const categorySales = Object.values(data.reduce((acc, detalle) => {
            if (!detalle.productos?.categorias) return acc;
            const name = detalle.productos.categorias.nombre;
            if (!acc[name]) acc[name] = { categoria: name, total: 0 };
            acc[name].total += detalle.subtotal;
            return acc;
        }, {} as { [key: string]: { categoria: string, total: number } }));
        return categorySales.sort((a, b) => b.total - a.total);
    }

    return []
  } catch (error: any) {
    console.error(`Error al generar reporte de ${reportType}:`, error.message)
    return []
  }
}

// SIN USAR RPC
export async function getDashboardSummary(period: string, date: Date) {
    const supabase = await createClient()
    const { gte, lte } = getDateRange(period, date)
    try {
        const { data: ordenes, error: ordenesError } = await supabase.from('ordenes').select('id, fecha_orden, total, clientes!inner(id, nombre, apellido)').eq('estado', 'completada').gte('fecha_orden', gte).lte('fecha_orden', lte)
        if (ordenesError) throw new Error(`Error al obtener órdenes: ${ordenesError.message}`)
        
        const ordenIds = ordenes.map(o => o.id)
        if (ordenIds.length === 0) {
            return {
                ventas: { totalVentas: 0, numOrdenes: 0, promedioPorOrden: 0, diaMasVentas: 'N/A', productosVendidos: 0 },
                productos: [], clientes: [], categorias: [],
            }
        }

        const { data: detallesData, error: detallesError } = await supabase.from('detalles_orden').select('cantidad, subtotal, productos!inner(nombre, categorias!inner(nombre))').in('orden_id', ordenIds)
        if (detallesError) throw new Error(`Error al obtener detalles: ${detallesError.message}`)

        const totalVentas = ordenes.reduce((sum, item) => sum + item.total, 0)
        const numOrdenes = ordenes.length
        const diaMasVentas = [...ordenes].sort((a, b) => b.total - a.total)[0]
        const productosVendidos = detallesData.reduce((sum, item) => sum + item.cantidad, 0)
        
        const topProductos = Object.values(detallesData.reduce((acc, d) => {
            const name = d.productos.nombre;
            if (!acc[name]) acc[name] = { nombre: name, total: 0 };
            acc[name].total += d.subtotal;
            return acc;
        }, {} as {[key:string]: {nombre: string, total: number}})).sort((a,b) => b.total - a.total).slice(0, 3);
        
        const topCategorias = Object.values(detallesData.reduce((acc, d) => {
             if (!d.productos?.categorias) return acc;
             const name = d.productos.categorias.nombre;
             if (!acc[name]) acc[name] = { categoria: name, total: 0 };
             acc[name].total += d.subtotal;
             return acc;
        }, {} as {[key:string]: {categoria: string, total: number}})).sort((a,b) => b.total - a.total).slice(0, 3);

        const topClientes = Object.values(ordenes.reduce((acc, o) => {
            const id = o.clientes.id;
            if (!acc[id]) acc[id] = { nombre: `${o.clientes.nombre} ${o.clientes.apellido || ''}`.trim(), visitas: 0, total: 0 };
            acc[id].visitas += 1;
            acc[id].total += o.total;
            return acc;
        }, {} as {[key:string]: {nombre: string, visitas: number, total:number}})).sort((a,b) => b.visitas - a.visitas).slice(0, 3);
        
        return {
            ventas: {
                totalVentas, numOrdenes, promedioPorOrden: numOrdenes > 0 ? totalVentas / numOrdenes : 0,
                diaMasVentas: diaMasVentas ? new Date(diaMasVentas.fecha_orden).toLocaleDateString('es-EC') : 'N/A',
                productosVendidos,
            },
            productos: topProductos,
            clientes: topClientes,
            categorias: topCategorias,
        }
    } catch (error: any) {
        console.error("Error en getDashboardSummary:", error.message)
        return null
    }
}