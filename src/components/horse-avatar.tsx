"use client"

import * as React from "react"
import { useState } from "react"
import { useUploadFiles } from "@xixixao/uploadstuff/react"
import type { UploadFileResponse } from "@xixixao/uploadstuff"
import { useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Loader2, Upload, X } from "lucide-react"

interface HorseAvatarProps {
  avatarUrl?: string
  onStorageIdChange: (storageId: Id<"_storage"> | undefined) => void
}

export function HorseAvatar({ avatarUrl, onStorageIdChange }: HorseAvatarProps) {
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(avatarUrl)
  
  // Get upload URL from Convex
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  
  // Handle file upload using uploadstuff
  const { startUpload } = useUploadFiles({
    getUploadUrl: async () => {
      const result = await generateUploadUrl()
      return result.uploadUrl
    },
    onUploadComplete: async (uploadedFiles: UploadFileResponse[]) => {
      setIsUploading(false)
      
      if (uploadedFiles.length > 0) {
        const file = uploadedFiles[0]
        
        // Check file size (max 1MB)
        if (file.size > 1024 * 1024) {
          toast.error("Image is too large. Maximum size is 1MB.")
          return
        }
        
        // Set the storage ID for the parent component
        onStorageIdChange(file.response.storageId as Id<"_storage">)
        
        // Create a preview URL
        setPreviewUrl(URL.createObjectURL(file.file))
        toast.success("Avatar uploaded successfully")
      }
    },
    onUploadError: (error: Error) => {
      setIsUploading(false)
      console.error("Upload error:", error)
      toast.error("Failed to upload image")
    },
  })
  
  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }
    
    // Check file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast.error("Image is too large. Maximum size is 1MB.")
      return
    }
    
    setIsUploading(true)
    await startUpload([file])
  }
  
  // Clear the avatar
  const handleClearAvatar = () => {
    setPreviewUrl(undefined)
    onStorageIdChange(undefined)
  }
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="w-32 h-32">
          {previewUrl ? (
            <AvatarImage src={previewUrl} alt="Horse avatar" />
          ) : null}
          <AvatarFallback className="text-2xl">
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              "🐎"
            )}
          </AvatarFallback>
        </Avatar>
        
        {previewUrl && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={handleClearAvatar}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <label htmlFor="avatar-upload">
          <Button
            variant="outline"
            className="cursor-pointer"
            disabled={isUploading}
            asChild
          >
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {previewUrl ? "Change Avatar" : "Upload Avatar"}
            </div>
          </Button>
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <p className="text-xs text-muted-foreground">
          Max size: 1MB. Recommended: square image.
        </p>
      </div>
    </div>
  )
}
