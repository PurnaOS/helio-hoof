"use client";

import { useUser } from "@clerk/nextjs";
import { ArrowLeft, Calendar, ImageIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AnalysisReport } from "@/components/analysis-report";
import { UserNav } from "@/components/auth/user-nav";
import { ImageUpload, type UploadedImage } from "@/components/image-upload";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { isSignedIn } = useUser();
  const [analysis, setAnalysis] = useState<string>("");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [analysisName, setAnalysisName] = useState<string>("");
  const [analysisDescription, setAnalysisDescription] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleAnalysis = (
    result: string,
    images?: UploadedImage[],
    name?: string,
    description?: string,
  ) => {
    setAnalysis(result);
    setUploadedImages(images || []);
    setAnalysisName(name || "");
    setAnalysisDescription(description || "");
    setError("");
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setAnalysis("");
  };

  const handleReset = () => {
    setAnalysis("");
    setUploadedImages([]);
    setAnalysisName("");
    setAnalysisDescription("");
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
              {isSignedIn && (
                <Link href="/history">
                  <Button variant="outline" size="sm">
                    View History
                  </Button>
                </Link>
              )}
              <UserNav />
            </div>
          </div>
        </div>
      </header>

      {analysis ? (
        <>
          {/* Back navigation for analysis results */}
          <div className="container mx-auto px-4 py-4">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              New Analysis
            </button>
          </div>

          {/* Analysis header with name and description - matching historical page */}
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {analysisName ||
                        `${uploadedImages.length > 1 ? "Multi" : "Single"} Image Analysis`}
                    </h1>
                    {analysisDescription && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        {analysisDescription}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        uploadedImages.length === 1
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                      }`}
                    >
                      {uploadedImages.length === 1 ? "Single" : "Multi"} Image
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <ImageIcon className="h-4 w-4" />
                    <span>
                      {uploadedImages.length} image
                      {uploadedImages.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <AnalysisReport
              analysis={analysis}
              uploadedImages={uploadedImages}
              onReset={handleReset}
              showResetButton={false}
              name={analysisName}
              description={analysisDescription}
            />
          </div>
        </>
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Show Jumping Analyzer
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Upload single or multiple show jumping images for expert
              equestrian analysis. Get detailed feedback on rider technique,
              horse performance, and partnership dynamics with comparative
              analysis across multiple images.
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

          <ImageUpload onAnalysis={handleAnalysis} onError={handleError} />
        </div>
      )}
    </div>
  );
}
