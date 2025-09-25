"use client";

import { useState } from "react";
import Link from "next/link";
import { AnalysisReport } from "@/components/analysis-report";
import { ImageUpload, type UploadedImage } from "@/components/image-upload";
import { UserNav } from "@/components/auth/user-nav";
import { Button } from "@/components/ui/button";

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


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Navigation */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🏇</span>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Helio-Hoof
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/history">
                <Button variant="outline" size="sm">
                  View History
                </Button>
              </Link>
              <UserNav />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Show Jumping Analyzer
          </h2>
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
          <AnalysisReport
            analysis={analysis}
            uploadedImages={uploadedImages}
            onReset={handleReset}
          />
        ) : (
          <ImageUpload onAnalysis={handleAnalysis} onError={handleError} />
        )}
      </div>
    </div>
  );
}
