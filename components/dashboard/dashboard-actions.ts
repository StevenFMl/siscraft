"use server"

import { createClient } from "@/utils/supabase/server"
import { getDashboardSummary } from "./reportes/reportes-actions"

export async function getDashboardData() {
    const supabase = await createClient();

    try {
        // 1. Reutilizamos la función de resumen para obtener métricas del último mes
        const summaryData = await getDashboardSummary('mes', new Date());

        // 2. Obtenemos las 5 órdenes más recientes
        const { data: recentOrders, error: ordersError } = await supabase
            .from('ordenes')
            .select('id, total, estado, fecha_orden, clientes(nombre, apellido)')
            .order('fecha_orden', { ascending: false })
            .limit(5);
        if (ordersError) throw ordersError;

        // 3. Obtenemos el conteo total de productos
        const { count: productCount, error: countError } = await supabase
            .from('productos')
            .select('*', { count: 'exact', head: true });
        if (countError) throw countError;

        // 4. Formateamos los datos para que los componentes los entiendan
        const metrics = {
            totalSales: summaryData?.ventas.totalVentas || 0,
            totalOrders: summaryData?.ventas.numOrdenes || 0,
            averageOrder: summaryData?.ventas.promedioPorOrden || 0,
            productCount: productCount || 0
        };
        
        const popularProducts = (summaryData?.productos || []).map((p: any) => ({
            ...p,
            sales_count: p.cantidad // Renombramos 'cantidad' a 'sales_count' para que coincida con el componente
        }));
        
        const formattedRecentOrders = recentOrders.map(order => ({
            id: order.id,
            total: order.total,
            status: order.estado,
            created_at: order.fecha_orden,
            customer_name: order.clientes ? `${order.clientes.nombre} ${order.clientes.apellido || ''}`.trim() : 'N/A',
        }));

        return {
            metrics,
            recentOrders: formattedRecentOrders,
            popularProducts
        };

    } catch (error: any) {
        console.error("Error al obtener los datos del dashboard:", error.message);
        // Devolvemos una estructura vacía en caso de error para que la app no se rompa
        return {
            metrics: { totalSales: 0, totalOrders: 0, averageOrder: 0, productCount: 0 },
            recentOrders: [],
            popularProducts: []
        };
    }
}