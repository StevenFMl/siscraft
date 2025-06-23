"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, ImageIcon, AlertCircle } from "lucide-react"
import { uploadProductImage } from "./upload-actions"

interface ImageUploadProps {
  onImageUploaded?: (imageUrl: string) => void
  defaultImage?: string
  className?: string
}

export default function ImageUpload({ onImageUploaded, defaultImage, className = "" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultImage || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Mostrar vista previa
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setIsUploading(true)
    setError(null)

    try {
      // Crear FormData
      const formData = new FormData()
      formData.append("file", file)

      // Subir imagen
      const result = await uploadProductImage(formData)

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.publicUrl && onImageUploaded) {
        onImageUploaded(result.publicUrl)
      }
    } catch (err: any) {
      setError(err.message || "Error al subir la imagen")
    } finally {
      setIsUploading(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col items-center">
        {previewUrl ? (
          <div className="relative mb-4 rounded-md overflow-hidden border border-amber-200">
            <img
              src={previewUrl || "/placeholder.svg"}
              alt="Vista previa"
              className="w-full max-w-[300px] h-auto object-cover"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-[200px] bg-muted rounded-md mb-4 border border-dashed border-amber-200">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <Button
            type="button"
            onClick={triggerFileInput}
            disabled={isUploading}
            variant="outline"
            className="border-amber-200"
          >
            {isUploading ? "Subiendo..." : "Seleccionar imagen"}
            <Upload className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
