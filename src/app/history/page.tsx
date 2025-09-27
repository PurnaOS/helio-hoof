"use client";

import { useUser } from "@clerk/nextjs";
import {
  Calendar,
  ChevronRight,
  Eye,
  Image as ImageIcon,
  Loader2,
  Star,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { AnalysisHistory } from "@/lib/db/schema";

export default function HistoryPage() {
  const { isSignedIn, isLoaded } = useUser();
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/analysis-history");

      if (!response.ok) {
        throw new Error("Failed to fetch history");
      }

      const data = await response.json();
      setHistory(data.history || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      fetchHistory();
    }
  }, [isSignedIn, fetchHistory]);

  const deleteAnalysis = async (id: string) => {
    try {
      const response = await fetch(`/api/analysis-history/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete analysis");
      }

      // Remove from local state
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete analysis",
      );
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  // Helper function to extract overall scores from analysis JSON
  const extractScores = (analysisResult: string) => {
    try {
      // First try to parse the entire string as JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(analysisResult);
      } catch {
        // If that fails, try to extract JSON from the string
        const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          return { riderScore: 0, horseScore: 0, type: "unknown" };
        }

        // Clean up the JSON string to handle common issues
        let jsonString = jsonMatch[0];

        // Remove any trailing commas that might cause JSON parsing errors
        jsonString = jsonString.replace(/,(\s*[}\]])/g, "$1");

        // Remove any control characters that might cause issues
        // biome-ignore lint/suspicious/noControlCharactersInRegex: Intentionally removing control characters from JSON
        jsonString = jsonString.replace(/[\u0000-\u001F\u007F]/g, "");

        // Try to parse the cleaned JSON
        parsed = JSON.parse(jsonString);
      }

      // For single image analysis
      if (parsed && typeof parsed === "object" && parsed !== null) {
        const parsedObj = parsed as Record<string, unknown>;
        if (parsedObj.rider_analysis && parsedObj.horse_analysis) {
          const riderAnalysis = parsedObj.rider_analysis as Record<
            string,
            unknown
          >;
          const horseAnalysis = parsedObj.horse_analysis as Record<
            string,
            unknown
          >;
          return {
            riderScore: (riderAnalysis.overall_score as number) || 0,
            horseScore: (horseAnalysis.overall_score as number) || 0,
            type: "single",
          };
        }

        // For multi-image analysis
        if (
          parsedObj.individual_analyses &&
          Array.isArray(parsedObj.individual_analyses)
        ) {
          const individualAnalyses = parsedObj.individual_analyses as Array<
            Record<string, unknown>
          >;
          const avgRider =
            individualAnalyses.reduce(
              (sum: number, analysis: Record<string, unknown>) =>
                sum + ((analysis.rider_score as number) || 0),
              0,
            ) / individualAnalyses.length;
          const avgHorse =
            individualAnalyses.reduce(
              (sum: number, analysis: Record<string, unknown>) =>
                sum + ((analysis.horse_score as number) || 0),
              0,
            ) / individualAnalyses.length;

          return {
            riderScore: Math.round(avgRider * 10) / 10,
            horseScore: Math.round(avgHorse * 10) / 10,
            type: "multi",
            imageCount: individualAnalyses.length,
          };
        }
      }
    } catch (error) {
      console.error("Error parsing analysis scores:", error);
      console.error(
        "Analysis data that failed to parse:",
        `${analysisResult.substring(0, 200)}...`,
      );
    }

    return null;
  };

  // Helper function to get score color
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const _truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength).trim()}...`;
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
              Please sign in to view your analysis history.
            </p>
            <Link href="/sign-in">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3">
                <span className="text-2xl">🏇</span>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Helio-Hoof
                </h1>
              </Link>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                Analysis History
              </span>
            </div>
            <Link href="/">
              <Button variant="outline">Back to Analyzer</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Analysis History
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {history.length === 0
                  ? "View and manage your past equestrian analyses"
                  : `${history.length} analysis${history.length !== 1 ? "es" : ""} found`}
              </p>
            </div>
            {history.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>
                    Single:{" "}
                    {history.filter((h) => h.analysisType === "single").length}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>
                    Multi:{" "}
                    {history.filter((h) => h.analysisType === "multi").length}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                {error}
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Loading your analysis history...
            </span>
          </div>
        ) : history.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No analyses yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start by uploading and analyzing your first show jumping image
              </p>
              <Link href="/">
                <Button>Start Analyzing</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item) => (
              <Card
                key={item.id}
                className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer"
              >
                <button
                  type="button"
                  className="w-full text-left bg-transparent border-none p-0 cursor-pointer"
                  onClick={() => {
                    window.location.href = `/history/${item.id}`;
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge
                        variant={
                          item.analysisType === "single"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {item.analysisType === "single" ? "Single" : "Multi"}{" "}
                        Image
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAnalysis(item.id);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Analysis Name and Description */}
                    <div className="mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                        {item.name ||
                          `${item.analysisType === "single" ? "Single" : "Multi"} Image Analysis`}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                      <ImageIcon className="h-4 w-4" />
                      <span>
                        {item.imageCount} image
                        {item.imageCount !== 1 ? "s" : ""}
                      </span>
                      <span>•</span>
                      <Calendar className="h-4 w-4" />
                      <span>
                        {item.createdAt
                          ? formatDate(item.createdAt).split(",")[0]
                          : "Unknown"}
                      </span>
                    </div>

                    {/* Image Thumbnails */}
                    {item.images && item.images.length > 0 && (
                      <div className="mb-4">
                        <div className="flex gap-2 overflow-hidden">
                          {item.images.slice(0, 4).map((img, index) => (
                            <div
                              key={img.id || `thumb-${index}`}
                              className="relative"
                            >
                              {img.base64Data ? (
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                                  <Image
                                    src={`data:${img.type};base64,${img.base64Data}`}
                                    alt={`Analysis image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                </div>
                              ) : (
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-gray-200 dark:border-gray-600">
                                  <ImageIcon className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                          ))}
                          {item.images.length > 4 && (
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg flex items-center justify-center border-2 border-blue-200 dark:border-blue-700">
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                +{item.images.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Performance Scores */}
                      {(() => {
                        const scores = extractScores(item.analysisResult);
                        return scores ? (
                          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Overall Scores
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center">
                                <div
                                  className={`text-2xl font-bold ${getScoreColor(scores.riderScore)}`}
                                >
                                  {scores.riderScore}/10
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Rider
                                </div>
                              </div>
                              <div className="text-center">
                                <div
                                  className={`text-2xl font-bold ${getScoreColor(scores.horseScore)}`}
                                >
                                  {scores.horseScore}/10
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Horse
                                </div>
                              </div>
                            </div>
                            {scores.type === "multi" && (
                              <div className="mt-2 text-center">
                                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                  Average across {scores.imageCount} images
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
                              Analysis results ready for review
                            </p>
                          </div>
                        );
                      })()}

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                          {item.metadata?.model && (
                            <>
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span>Claude Analysis</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 group-hover:text-blue-600 transition-colors">
                          <Eye className="h-3 w-3 mr-1" />
                          View Full Report
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
