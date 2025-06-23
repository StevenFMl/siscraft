"use server"

import { createAdminClient } from "../../../utils/supabase/admin"
import { createClient } from "../../../utils/supabase/server"

// Función para diagnosticar el estado del almacenamiento
export async function diagnoseStorage() {
  try {
    // Verificar autenticación
    const supabase = createClient()
    const {
      data: { user },
    } = await (await supabase).auth.getUser()

    if (!user) {
      return {
        authenticated: false,
        error: "No autenticado",
        buckets: [],
        targetBucket: null,
        createBucketResult: null,
        uploadTest: null,
      }
    }

    // Usar el cliente normal para diagnóstico
    // Listar buckets
    const { data: buckets, error: bucketsError } = await (await supabase).storage.listBuckets()

    // Verificar bucket específico
    const bucketName = "productos-imagenes"
    const { data: bucketExists, error: bucketError } = await (await supabase).storage.getBucket(bucketName)

    // Intentar crear el bucket si no existe
    let createBucketResult = null
    if (!bucketExists) {
      const { data, error } = await (await supabase).storage.createBucket(bucketName, {
        public: true,
      })
      createBucketResult = { success: !error, error: error?.message }
    }

    // Prueba de carga
    let uploadTest = null
    try {
      const testFile = new Blob(["test"], { type: "text/plain" })
      const fileName = `test-${Date.now()}.txt`
      const { data, error } = await (await supabase).storage.from(bucketName).upload(fileName, testFile)

      if (error) {
        uploadTest = { success: false, error: error.message }
      } else {
        // Eliminar el archivo de prueba
        await (await supabase).storage.from(bucketName).remove([fileName])
        uploadTest = { success: true }
      }
    } catch (e) {
      uploadTest = { success: false, error: e instanceof Error ? e.message : "Error desconocido" }
    }

    return {
      authenticated: true,
      success: bucketExists && !bucketError && uploadTest?.success,
      buckets: buckets || [],
      targetBucket: bucketExists,
      bucketError: bucketError?.message,
      createBucketResult,
      uploadTest,
      timestamp: new Date().toLocaleString(),
    }
  } catch (error) {
    return {
      authenticated: false,
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
      buckets: [],
      targetBucket: null,
      createBucketResult: null,
      uploadTest: null,
      timestamp: new Date().toLocaleString(),
    }
  }
}

// Función para arreglar el bucket (recrearlo desde cero)
export async function fixBucket() {
  try {
    // Verificar autenticación
    const supabase = createClient()
    const {
      data: { user },
    } = await (await supabase).auth.getUser()

    if (!user) {
      return {
        success: false,
        error: "No autenticado",
      }
    }

    // Usar el cliente admin para operaciones privilegiadas
    const adminClient = createAdminClient()
    const bucketName = "productos-imagenes"

    // 1. Verificar si el bucket existe
    const { data: bucketData, error: bucketError } = await adminClient.storage.getBucket(bucketName)

    // 2. Si existe, intentar eliminarlo (primero hay que eliminar todos los archivos)
    if (bucketData) {
      // Listar todos los archivos
      const { data: files, error: listError } = await adminClient.storage.from(bucketName).list()

      if (listError) {
        return {
          success: false,
          error: `Error al listar archivos: ${listError.message}`,
        }
      }

      // Eliminar todos los archivos si existen
      if (files && files.length > 0) {
        const filePaths = files.map(file => file.name)
        const { error: removeError } = await adminClient.storage.from(bucketName).remove(filePaths)

        if (removeError) {
          return {
            success: false,
            error: `Error al eliminar archivos: ${removeError.message}`,
          }
        }
      }

      // Ahora intentar eliminar el bucket
      const { error: deleteError } = await adminClient.storage.deleteBucket(bucketName)

      if (deleteError) {
        return {
          success: false,
          error: `Error al eliminar bucket: ${deleteError.message}`,
        }
      }
    }

    // 3. Crear el bucket nuevamente
    const { error: createError } = await adminClient.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 10485760, // 10MB
    })

    if (createError) {
      return {
        success: false,
        error: `Error al crear bucket: ${createError.message}`,
      }
    }

    // 4. Configurar políticas de acceso público (opcional)
    try {
      // Política para permitir lectura pública
      await adminClient.storage.from(bucketName).getPublicUrl('dummy.txt')
    } catch (e) {
      // Ignoramos errores aquí ya que solo estamos probando la URL pública
    }

    return {
      success: true,
      message: "Bucket recreado correctamente",
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

// Función para inicializar el almacenamiento (asegurarse de que el bucket existe)
export async function inicializarAlmacenamiento() {
  try {
    // Verificar autenticación
    const supabase = createClient()
    const {
      data: { user },
    } = await (await supabase).auth.getUser()

    if (!user) {
      return {
        success: false,
        error: "No autenticado",
      }
    }

    const bucketName = "productos-imagenes"

    // Verificar si el bucket existe
    const { data: bucketExists, error: bucketError } = await (await supabase).storage.getBucket(bucketName)

    // Si no existe, intentar crearlo
    if (!bucketExists) {
      const { error: createError } = await (await supabase).storage.createBucket(bucketName, {
        public: true,
      })

      if (createError) {
        // Si falla la creación, intentar con el cliente admin
        const adminClient = createAdminClient()
        const { error: adminCreateError } = await adminClient.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
        })

        if (adminCreateError) {
          return {
            success: false,
            error: `Error al crear bucket: ${adminCreateError.message}`,
          }
        }
      }
    }

    // Probar si podemos subir un archivo
    try {
      const testFile = new Blob(["test"], { type: "text/plain" })
      const fileName = `test-init-${Date.now()}.txt`
      const { error: uploadError } = await (await supabase).storage.from(bucketName).upload(fileName, testFile)

      if (uploadError) {
        // Si hay error al subir, intentar arreglar el bucket
        return await fixBucket()
      }

      // Eliminar el archivo de prueba
      await (await supabase).storage.from(bucketName).remove([fileName])
    } catch (e) {
      // Si hay cualquier error, intentar arreglar el bucket
      return await fixBucket()
    }

    return {
      success: true,
      message: bucketExists ? "Bucket existente verificado" : "Bucket creado correctamente",
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

// Función para subir una imagen de producto
export async function uploadProductImage(formData: FormData) {
  try {
    const file = formData.get("file") as File

    if (!file) {
      return { error: "No se proporcionó ningún archivo" }
    }

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      return { error: "El archivo debe ser una imagen" }
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { error: "La imagen no debe superar los 5MB" }
    }

    // Asegurarse de que el bucket existe
    const initResult = await inicializarAlmacenamiento()
    if (!initResult.success) {
      return { error: `Error al inicializar el almacenamiento: ${initResult.error}` }
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `productos/${fileName}`

    // Usar el cliente de Supabase del servidor
    const supabase = await createClient()

    // Intentar subir el archivo
    const { data, error } = await supabase.storage.from("productos-imagenes").upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    })

    if (error) {
      console.error("Error al subir la imagen:", error)
      return { error: error.message }
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage.from("productos-imagenes").getPublicUrl(filePath)

    return {
      success: true,
      filePath,
      publicUrl: publicUrlData.publicUrl,
    }
  } catch (error: any) {
    console.error("Error inesperado al subir la imagen:", error)
    return { error: error.message || "Error inesperado al subir la imagen" }
  }
}