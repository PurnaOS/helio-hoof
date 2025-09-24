"use client";

import { useState, useEffect, use } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { EquestrianAnalysis } from "@/components/equestrian-analysis";
import { MultiImageAnalysis } from "@/components/multi-image-analysis";
import Link from "next/link";
import { AnalysisHistory } from "@/lib/db/schema";

interface AnalysisDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AnalysisDetailPage({ params }: AnalysisDetailPageProps) {
  const { isSignedIn, isLoaded } = useUser();
  const [analysis, setAnalysis] = useState<AnalysisHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const resolvedParams = use(params);

  useEffect(() => {
    if (isSignedIn) {
      fetchAnalysis();
    }
  }, [isSignedIn, resolvedParams.id]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analysis-history/${resolvedParams.id}`);

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
  };


  const isMultiImageAnalysis = (analysisText: string): boolean => {
    try {
      const jsonMatch = analysisText.match(/\\{[\\s\\S]*\\}/);
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
          <p className="text-gray-600 dark:text-gray-400">Loading analysis...</p>
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

  // Create mock uploaded images from the analysis data
  const mockUploadedImages = analysis.images.map((img, index) => ({
    id: img.id,
    file: new File([], img.filename, { type: img.type }),
    previewUrl: "", // No preview URL for historical data
  }));

  // For single image analysis, create a minimal structure that won't display the image
  // since we don't have preview URLs for historical data
  const singleImageMock = analysis.analysisType === "single" && analysis.images.length > 0
    ? [] // Empty array so image won't display in history
    : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Simple back navigation */}
      <div className="container mx-auto px-4 py-4">
        <Link href="/history" className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to History
        </Link>
      </div>

      {/* Main content area - identical to analysis results page */}
      <div className="container mx-auto px-4 py-8">
        {/* Render the analysis using existing components - exactly like main page */}
        {isMultiImageAnalysis(analysis.analysisResult) ? (
          <MultiImageAnalysis
            analysis={analysis.analysisResult}
            uploadedImages={mockUploadedImages}
            onReset={() => window.location.href = '/'}
            showResetButton={true}
          />
        ) : (
          <EquestrianAnalysis
            analysis={analysis.analysisResult}
            onReset={() => window.location.href = '/'}
            showResetButton={true}
            uploadedImages={singleImageMock}
          />
        )}
      </div>
    </div>
  );
}