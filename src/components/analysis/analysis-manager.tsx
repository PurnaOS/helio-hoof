"use client";

import { ArrowLeft, Calendar, ImageIcon } from "lucide-react";
import { useState } from "react";
import { AnalysisReport } from "@/components/analysis-report";
import { ImageUpload, type UploadedImage } from "@/components/image-upload";

interface AnalysisManagerProps {
  children?: React.ReactNode;
}

/**
 * Client component that manages the analysis state and workflow
 * Contains all interactive logic while keeping the UI rendering separate
 */
export function AnalysisManager({ children }: AnalysisManagerProps) {
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

  if (analysis) {
    return (
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
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {children}

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
  );
}
