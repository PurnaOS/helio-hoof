"use client";

import { useUser } from "@clerk/nextjs";
import { ArrowLeft, Calendar, ImageIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { AnalysisReport } from "@/components/analysis-report";
import type { UploadedImage } from "@/components/image-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AnalysisHistory } from "@/lib/db/schema";

interface AnalysisDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AnalysisDetailPage({
  params,
}: AnalysisDetailPageProps) {
  const { isSignedIn, isLoaded } = useUser();
  const [analysis, setAnalysis] = useState<AnalysisHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const resolvedParams = use(params);

  const fetchAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/analysis-history/${resolvedParams.id}`,
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Analysis not found");
        }
        throw new Error("Failed to fetch analysis");
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analysis");
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    if (isSignedIn) {
      fetchAnalysis();
    }
  }, [isSignedIn, fetchAnalysis]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Sign in Required</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please sign in to view this analysis.
            </p>
            <Link href="/sign-in">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading analysis...
          </p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Error</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || "Analysis not found"}
            </p>
            <Link href="/history">
              <Button>Back to History</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Reconstruct UploadedImage objects from stored data for consistent component usage
  const reconstructedImages: UploadedImage[] = analysis.images.map(
    (img, index) => {
      // Create a data URL from base64 if available
      const previewUrl = img.base64Data
        ? `data:${img.type};base64,${img.base64Data}`
        : "";

      // Create a File object from the stored data (for component compatibility)
      const file = new File([], img.filename, { type: img.type });

      return {
        id: img.id || `image-${index}`,
        file: file,
        previewUrl: previewUrl,
        base64: img.base64Data,
        mimeType: img.type,
        filename: img.filename,
      };
    },
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Simple back navigation */}
      <div className="container mx-auto px-4 py-4">
        <Link
          href="/history"
          className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to History
        </Link>
      </div>

      {/* Main content area - using same components as main analysis page */}
      <div className="container mx-auto px-4 py-8">
        {/* Analysis Header with Name and Description */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {analysis.name ||
                    `${analysis.analysisType === "single" ? "Single" : "Multi"} Image Analysis`}
                </h1>
                {analysis.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {analysis.description}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Badge
                  variant={
                    analysis.analysisType === "single" ? "default" : "secondary"
                  }
                >
                  {analysis.analysisType === "single" ? "Single" : "Multi"}{" "}
                  Image
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <ImageIcon className="h-4 w-4" />
                <span>
                  {analysis.imageCount} image
                  {analysis.imageCount !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {analysis.createdAt
                    ? new Date(analysis.createdAt).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Render the analysis using the unified AnalysisReport component */}
        <AnalysisReport
          analysis={analysis.analysisResult}
          uploadedImages={reconstructedImages}
          onReset={() => {
            window.location.href = "/";
          }}
          showResetButton={true}
        />
      </div>
    </div>
  );
}
