"use client";

import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, convertToBase64, validateImageFile } from "@/lib/utils";
import Link from "next/link";

interface ImageUploadProps {
  onAnalysis: (analysis: string, images?: UploadedImage[]) => void;
  onError: (error: string) => void;
}

export interface UploadedImage {
  file: File;
  previewUrl: string;
  id: string;
}

export function ImageUpload({ onAnalysis, onError }: ImageUploadProps) {
  const { isSignedIn, isLoaded } = useUser();
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newImages: UploadedImage[] = [];

      for (const file of acceptedFiles) {
        const validation = validateImageFile(file);
        if (!validation.isValid) {
          onError(validation.error || "Invalid file");
          continue;
        }

        const url = URL.createObjectURL(file);
        newImages.push({
          file,
          previewUrl: url,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
        });
      }

      setUploadedImages((prev) => [...prev, ...newImages]);
    },
    [onError],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"],
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show sign-in prompt if user is not authenticated
  if (!isSignedIn) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <div className="mb-6">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Sign in to start analyzing
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Create an account or sign in to upload and analyze your show jumping images
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <Link href="/sign-in">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link href="/sign-up">
                  <Button>Get Started</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const removeImage = (imageId: string) => {
    setUploadedImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }
      return prev.filter((img) => img.id !== imageId);
    });
  };

  const clearAllImages = () => {
    for (const img of uploadedImages) {
      URL.revokeObjectURL(img.previewUrl);
    }
    setUploadedImages([]);
  };

  const analyzeImages = async () => {
    if (uploadedImages.length === 0) return;

    setIsAnalyzing(true);
    try {
      if (uploadedImages.length === 1) {
        // Single image analysis
        const img = uploadedImages[0];
        const base64 = await convertToBase64(img.file);

        const response = await fetch("/api/analyze-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: img.file.type,
            filename: img.file.name,
            size: img.file.size,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to analyze image");
        }

        onAnalysis(data.analysis, uploadedImages);
      } else {
        // Multi-image analysis
        const imageData = await Promise.all(
          uploadedImages.map(async (img) => ({
            base64: await convertToBase64(img.file),
            mimeType: img.file.type,
            filename: img.file.name,
            size: img.file.size,
          })),
        );

        const response = await fetch("/api/analyze-images", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            images: imageData,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to analyze images");
        }

        onAnalysis(data.analysis, uploadedImages);
      }
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Failed to analyze images",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4" data-testid="image-upload">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                : "border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600",
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {isDragActive
                  ? "Drop the images here"
                  : uploadedImages.length > 0
                    ? "Add more images"
                    : "Upload images"}
              </p>
              <p className="text-sm text-gray-500">
                Drag and drop multiple image files here, or click to select
              </p>
              <p className="text-xs text-gray-400">
                Supports JPEG, PNG, WebP, GIF up to 10MB each
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Previews */}
      {uploadedImages.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {uploadedImages.length} Image
                  {uploadedImages.length > 1 ? "s" : ""} Selected
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllImages}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {uploadedImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <Image
                      src={image.previewUrl}
                      alt={`Preview of ${image.file.name}`}
                      className="w-full h-32 object-cover rounded-lg bg-gray-50 dark:bg-gray-900"
                      width={200}
                      height={128}
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(image.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="bg-black/70 text-white text-xs px-2 py-1 rounded truncate">
                        {image.file.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={analyzeImages}
                disabled={isAnalyzing || uploadedImages.length === 0}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing {uploadedImages.length} Image
                    {uploadedImages.length > 1 ? "s" : ""}...
                  </>
                ) : (
                  `Analyze ${uploadedImages.length} Image${uploadedImages.length > 1 ? "s" : ""}`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
