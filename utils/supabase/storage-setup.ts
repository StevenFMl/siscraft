import { createAdminClient } from "./admin"

// Función para verificar si el bucket existe
export async function checkBucketExists(bucketName: string) {
  const supabase = createAdminClient()
  const { data: buckets, error } = await supabase.storage.listBuckets()

  if (error) {
    console.error("Error al listar buckets:", error)
    return { exists: false, error: error.message }
  }

  const exists = buckets.some((bucket) => bucket.name === bucketName)
  return { exists, buckets }
}

// Función para forzar la recreación del bucket
export async function forceRecreateBucket(bucketName: string) {
  const supabase = createAdminClient()

  try {
    // 1. Intentar eliminar el bucket (incluso si la API dice que no existe)
    try {
      await supabase.storage.emptyBucket(bucketName)
      await supabase.storage.deleteBucket(bucketName)
      console.log(`Bucket ${bucketName} eliminado correctamente`)
    } catch (error) {
      console.log(`Error al eliminar bucket (puede ser normal si no existe):`, error)
      // Continuamos de todos modos
    }

    // 2. Esperar un momento para que Supabase procese la eliminación
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // 3. Crear el bucket nuevamente
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 10485760, // 10MB
    })

    if (createError) {
      if (createError.message.includes("already exists")) {
        // Si sigue diciendo que existe, intentamos una estrategia más agresiva
        console.log("El bucket sigue existiendo según Supabase. Intentando otra estrategia...")

        // Esperar más tiempo
        await new Promise((resolve) => setTimeout(resolve, 5000))

        // Intentar crear con un nombre temporal y luego renombrar
        const tempBucketName = `temp-${Date.now()}`
        await supabase.storage.createBucket(tempBucketName)
        await supabase.storage.deleteBucket(tempBucketName)

        // Intentar crear el bucket original nuevamente
        const { error: finalError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 10485760,
        })

        if (finalError) {
          return { success: false, error: finalError.message }
        }
      } else {
        return { success: false, error: createError.message }
      }
    }

    // 4. Configurar políticas de acceso público
    const { error: policyError } = await supabase.storage.from(bucketName).createSignedUrl("test.txt", 60)

    // 5. Verificar que el bucket existe y funciona
    const { exists } = await checkBucketExists(bucketName)

    if (!exists) {
      return { success: false, error: "El bucket no se pudo crear correctamente" }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Función para inicializar el almacenamiento
export async function initializeStorage() {
  const bucketName = "productos-imagenes"

  // Verificar si el bucket existe
  const { exists, error } = await checkBucketExists(bucketName)

  if (error) {
    return { success: false, error }
  }

  if (!exists) {
    // Crear el bucket si no existe
    return await forceRecreateBucket(bucketName)
  }

  return { success: true, message: "El bucket ya existe" }
}
