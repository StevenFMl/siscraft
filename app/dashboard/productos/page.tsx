import { Suspense } from "react"
import ProductosCombinedPage from "@/components/dashboard/productos/productos-page-combined"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando productos...</div>}>
      <ProductosCombinedPage />
    </Suspense>
  )
}
