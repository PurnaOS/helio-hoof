"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Image, Trash2, Eye, ChevronRight } from "lucide-react";
import Link from "next/link";
import { AnalysisHistory } from "@/lib/db/schema";

export default function HistoryPage() {
  const { isSignedIn, isLoaded } = useUser();
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isSignedIn) {
      fetchHistory();
    }
  }, [isSignedIn]);

  const fetchHistory = async () => {
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
  };

  const deleteAnalysis = async (id: string) => {
    try {
      const response = await fetch(`/api/analysis-history/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete analysis");
      }

      // Remove from local state
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete analysis");
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

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
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
              <span className="text-gray-600 dark:text-gray-400">Analysis History</span>
            </div>
            <Link href="/">
              <Button variant="outline">
                Back to Analyzer
              </Button>
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
                  : `${history.length} analysis${history.length !== 1 ? 'es' : ''} found`}
              </p>
            </div>
            {history.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Single: {history.filter(h => h.analysisType === 'single').length}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Multi: {history.filter(h => h.analysisType === 'multi').length}</span>
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
              <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
              <Card key={item.id} className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer">
                <div onClick={() => window.location.href = `/history/${item.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={item.analysisType === "single" ? "default" : "secondary"} className="text-xs">
                        {item.analysisType === "single" ? "Single" : "Multi"} Image
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

                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                      <Image className="h-4 w-4" />
                      <span>{item.imageCount} image{item.imageCount !== 1 ? "s" : ""}</span>
                      <span>•</span>
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(item.createdAt).split(',')[0]}</span>
                    </div>

                    {item.images && item.images.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {item.images.slice(0, 3).map((img, index) => (
                            <div key={index} className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-xs font-mono">
                              {img.filename.split('.')[0].substring(0, 8)}...
                            </div>
                          ))}
                          {item.images.length > 3 && (
                            <div className="bg-gray-200 dark:bg-gray-600 rounded px-2 py-1 text-xs">
                              +{item.images.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-4">
                          {truncateText(item.analysisResult, 200)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                          {item.metadata?.model && (
                            <>
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span>Claude</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 group-hover:text-blue-600 transition-colors">
                          <Eye className="h-3 w-3 mr-1" />
                          View Analysis
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}