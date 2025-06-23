"use server"

import { createAdminClient } from "@/utils/supabase/admin"

export async function diagnosticarStorage() {
  try {
    const supabase = createAdminClient()

    // Verificar si el bucket existe
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      return {
        success: false,
        message: `Error al listar buckets: ${bucketsError.message}`,
        error: bucketsError.message,
        availableBuckets: [],
      }
    }

    const bucketName = "productos-imagenes"
    const bucketExists = buckets.some((bucket) => bucket.name === bucketName)

    // Si el bucket existe, verificar si podemos acceder a él
    let bucketAccessible = false
    let bucketError = null

    if (bucketExists) {
      try {
        const { data, error } = await supabase.storage.from(bucketName).list()
        bucketAccessible = !error
        bucketError = error
      } catch (err: any) {
        bucketAccessible = false
        bucketError = err.message
      }
    }

    return {
      success: bucketExists && bucketAccessible,
      bucketExists,
      bucketAccessible,
      message: bucketError ? `Error al acceder al bucket: ${bucketError}` : undefined,
      availableBuckets: buckets,
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Error en el diagnóstico: ${error.message}`,
      error: error.message,
      availableBuckets: [],
    }
  }
}

export async function arreglarBucket() {
  try {
    const supabase = createAdminClient()
    const bucketName = "productos-imagenes"

    // Verificar si el bucket existe
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      return {
        success: false,
        error: `Error al listar buckets: ${bucketsError.message}`,
      }
    }

    const bucketExists = buckets.some((bucket) => bucket.name === bucketName)

    // Si el bucket existe, intentar eliminarlo
    if (bucketExists) {
      const { error: deleteError } = await supabase.storage.deleteBucket(bucketName)

      if (deleteError) {
        // Si no se puede eliminar, podría ser porque tiene archivos
        // Intentar eliminar todos los archivos primero
        const { data: files, error: listError } = await supabase.storage.from(bucketName).list()

        if (!listError && files) {
          // Eliminar cada archivo
          for (const file of files) {
            await supabase.storage.from(bucketName).remove([file.name])
          }

          // Intentar eliminar el bucket nuevamente
          const { error: deleteRetryError } = await supabase.storage.deleteBucket(bucketName)

          if (deleteRetryError) {
            return {
              success: false,
              error: `No se pudo eliminar el bucket después de eliminar archivos: ${deleteRetryError.message}`,
            }
          }
        } else {
          return {
            success: false,
            error: `Error al listar archivos: ${listError?.message || "Error desconocido"}`,
          }
        }
      }
    }

    // Crear el bucket
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 10485760, // 10MB
    })

    if (createError) {
      return {
        success: false,
        error: `Error al crear el bucket: ${createError.message}`,
      }
    }

    // Configurar políticas de acceso público
    const { error: policyError } = await supabase.storage.from(bucketName).createSignedUrl("dummy.txt", 1)

    if (policyError && !policyError.message.includes("not found")) {
      return {
        success: false,
        error: `Error al configurar políticas: ${policyError.message}`,
      }
    }

    return {
      success: true,
      message: "Bucket creado correctamente",
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Error al arreglar el bucket: ${error.message}`,
    }
  }
}

// Añadimos la función inicializarAlmacenamiento que faltaba
export async function inicializarAlmacenamiento() {
  try {
    const supabase = createAdminClient()
    const bucketName = "productos-imagenes"

    // Verificar si el bucket existe
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      return {
        success: false,
        error: `Error al listar buckets: ${bucketsError.message}`,
      }
    }

    const bucketExists = buckets.some((bucket) => bucket.name === bucketName)

    // Si el bucket no existe, crearlo
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      })

      if (createError) {
        return {
          success: false,
          error: `Error al crear el bucket: ${createError.message}`,
        }
      }
    }

    // Verificar si podemos acceder al bucket
    const { error: accessError } = await supabase.storage.from(bucketName).list()

    if (accessError) {
      // Si hay un error de acceso, intentar arreglar el bucket
      return await arreglarBucket()
    }

    return {
      success: true,
      message: bucketExists ? "Bucket existente verificado" : "Bucket creado correctamente",
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Error al inicializar el almacenamiento: ${error.message}`,
    }
  }
}
