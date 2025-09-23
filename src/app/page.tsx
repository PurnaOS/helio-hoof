"use client";

import { useState } from "react";
import { EquestrianAnalysis } from "@/components/equestrian-analysis";
import { ImageUpload, type UploadedImage } from "@/components/image-upload";
import { MultiImageAnalysis } from "@/components/multi-image-analysis";

export default function Home() {
  const [analysis, setAnalysis] = useState<string>("");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [error, setError] = useState<string>("");

  const handleAnalysis = (result: string, images?: UploadedImage[]) => {
    setAnalysis(result);
    setUploadedImages(images || []);
    setError("");
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setAnalysis("");
  };

  const handleReset = () => {
    setAnalysis("");
    setUploadedImages([]);
    setError("");
  };

  // Determine if this is a multi-image analysis based on JSON structure
  const isMultiImageAnalysis = (analysisText: string): boolean => {
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return (
          !!parsed.individual_analyses &&
          Array.isArray(parsed.individual_analyses)
        );
      }
    } catch {
      // If parsing fails, assume single image
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🏇 Helio-Hoof Show Jumping Analyzer
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Upload single or multiple show jumping images for expert equestrian
            analysis. Get detailed feedback on rider technique, horse
            performance, and partnership dynamics with comparative analysis
            across multiple images.
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                {error}
              </p>
            </div>
          </div>
        )}

        {analysis ? (
          isMultiImageAnalysis(analysis) ? (
            <MultiImageAnalysis
              analysis={analysis}
              uploadedImages={uploadedImages}
              onReset={handleReset}
            />
          ) : (
            <EquestrianAnalysis analysis={analysis} onReset={handleReset} />
          )
        ) : (
          <ImageUpload onAnalysis={handleAnalysis} onError={handleError} />
        )}
      </div>
    </div>
  );
}
