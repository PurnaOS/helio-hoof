"use client";

import {
  CheckCircle2,
  Copy,
  Download,
  Image as ImageIcon,
  Shield,
  Star,
  Target,
  Users,
} from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import type { UploadedImage } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportToEnhancedPDF } from "@/lib/enhanced-pdf-export";
import { convertToBase64 } from "@/lib/utils";

interface EquestrianAnalysisData {
  rider_analysis: {
    overall_score: number;
    positives: string[];
    areas_for_improvement: string[];
    priority_focus: string;
  };
  horse_analysis: {
    overall_score: number;
    positives: string[];
    technical_notes: string[];
    athletic_assessment: string;
  };
  partnership_notes: string;
  safety_observations: string;
}

interface ApiResponse {
  is_show_jumping?: boolean;
  message?: string;
  rider_analysis?: {
    overall_score?: number | string;
    positives?: string[];
    areas_for_improvement?: string[];
    priority_focus?: string;
  };
  horse_analysis?: {
    overall_score?: number | string;
    positives?: string[];
    technical_notes?: string[];
    athletic_assessment?: string;
  };
  partnership_notes?: string;
  safety_observations?: string;
}

interface EquestrianAnalysisProps {
  analysis: string;
  onReset: () => void;
  showResetButton?: boolean;
  uploadedImages?: UploadedImage[];
  name?: string;
  description?: string;
}

function ScoreDisplay({ score, label }: { score: number; label: string }) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="flex items-center gap-2">
      <Star className={`h-5 w-5 ${getScoreColor(score)}`} />
      <span className="text-lg font-semibold">{label}:</span>
      <span className={`text-xl font-bold ${getScoreColor(score)}`}>
        {score}/10
      </span>
    </div>
  );
}

function AnalysisSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  // Different gradient colors for different sections
  const getGradientColors = (title: string) => {
    if (title.includes("Rider")) {
      return {
        bg: "from-rose-50 to-pink-50 dark:from-rose-950 dark:to-pink-950",
        border: "border-rose-200 dark:border-rose-800",
        iconBg: "from-rose-500 to-pink-500",
        textColor: "text-rose-600 dark:text-rose-400",
      };
    } else if (title.includes("Horse")) {
      return {
        bg: "from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950",
        border: "border-amber-200 dark:border-amber-800",
        iconBg: "from-amber-500 to-orange-500",
        textColor: "text-amber-600 dark:text-amber-400",
      };
    } else if (title.includes("Partnership")) {
      return {
        bg: "from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950",
        border: "border-purple-200 dark:border-purple-800",
        iconBg: "from-purple-500 to-violet-500",
        textColor: "text-purple-600 dark:text-purple-400",
      };
    } else if (title.includes("Safety")) {
      return {
        bg: "from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950",
        border: "border-red-200 dark:border-red-800",
        iconBg: "from-red-500 to-rose-500",
        textColor: "text-red-600 dark:text-red-400",
      };
    }
    // Default
    return {
      bg: "from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950",
      border: "border-blue-200 dark:border-blue-800",
      iconBg: "from-blue-500 to-indigo-500",
      textColor: "text-blue-600 dark:text-blue-400",
    };
  };

  const colors = getGradientColors(title);

  return (
    <Card
      className={`bg-gradient-to-br ${colors.bg} ${colors.border} shadow-lg`}
    >
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div
            className={`w-9 h-9 bg-gradient-to-r ${colors.iconBg} rounded-lg flex items-center justify-center shadow-md`}
          >
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-800 dark:text-gray-200">
              {title}
            </span>
            <div
              className={`h-1 w-16 bg-gradient-to-r ${colors.iconBg} rounded-full mt-1`}
            ></div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-white/50 dark:border-gray-700/50">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

export function EquestrianAnalysis({
  analysis,
  onReset,
  showResetButton = true,
  uploadedImages = [],
  name,
  description,
}: EquestrianAnalysisProps) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [parsedData, setParsedData] = useState<EquestrianAnalysisData | null>(
    null,
  );
  const [parseError, setParseError] = useState<string>("");

  // Parse JSON from analysis on component mount
  React.useEffect(() => {
    try {
      let parsed: unknown = null;

      // Log the raw analysis for debugging
      console.log(
        "🔍 Raw analysis received:",
        analysis.substring(0, 300) + (analysis.length > 300 ? "..." : ""),
      );

      // Try parsing entire response as JSON first
      try {
        parsed = JSON.parse(analysis);
      } catch (firstError) {
        console.log("First JSON parse failed:", firstError);

        // Extract JSON from text using regex
        const jsonMatch = analysis.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            console.log("Found JSON match, attempting to parse...");
            console.log(
              "JSON match preview:",
              `${jsonMatch[0].substring(0, 200)}...`,
            );

            // Try to clean up common JSON issues
            let cleanJson = jsonMatch[0];

            // Remove trailing commas before closing brackets/braces
            cleanJson = cleanJson.replace(/,(\s*[}\]])/g, "$1");

            // Try parsing the cleaned JSON
            parsed = JSON.parse(cleanJson);
          } catch (secondError) {
            console.error("Second JSON parse failed:", secondError);
            console.log("Raw analysis text length:", analysis.length);
            console.log(
              "Raw analysis preview:",
              `${analysis.substring(0, 300)}...`,
            );
            console.log("JSON match length:", jsonMatch[0].length);
            console.log(
              "JSON match preview:",
              `${jsonMatch[0].substring(0, 300)}...`,
            );
            setParseError(
              `Failed to parse analysis data: ${secondError instanceof Error ? secondError.message : "Unknown error"}`,
            );
            return;
          }
        } else {
          console.error("No JSON structure found in analysis text");
          console.log("Analysis text:", `${analysis.substring(0, 300)}...`);

          // Check if this looks like an error message
          if (
            analysis.toLowerCase().includes("internal server error") ||
            analysis.toLowerCase().includes("error") ||
            analysis.toLowerCase().includes("failed")
          ) {
            setParseError(
              "Analysis service temporarily unavailable. Please try again in a moment.",
            );
          } else {
            setParseError(
              "The analysis response could not be processed. Please try uploading your image again.",
            );
          }
          return;
        }
      }

      if (parsed && typeof parsed === "object") {
        // Check if this is a non-show jumping image
        const apiResponse = parsed as ApiResponse;
        if (apiResponse.is_show_jumping === false) {
          setParseError(
            apiResponse.message ||
              "This image does not contain show jumping content suitable for analysis.",
          );
          return;
        }

        // Create normalized structure with defaults for show jumping analysis
        const normalizedData: EquestrianAnalysisData = {
          rider_analysis: {
            overall_score: Number(
              apiResponse.rider_analysis?.overall_score || 0,
            ),
            positives: Array.isArray(apiResponse.rider_analysis?.positives)
              ? apiResponse.rider_analysis.positives
              : [],
            areas_for_improvement: Array.isArray(
              apiResponse.rider_analysis?.areas_for_improvement,
            )
              ? apiResponse.rider_analysis.areas_for_improvement
              : [],
            priority_focus:
              apiResponse.rider_analysis?.priority_focus ||
              "Focus on core fundamentals and position.",
          },
          horse_analysis: {
            overall_score: Number(
              apiResponse.horse_analysis?.overall_score || 0,
            ),
            positives: Array.isArray(apiResponse.horse_analysis?.positives)
              ? apiResponse.horse_analysis.positives
              : [],
            technical_notes: Array.isArray(
              apiResponse.horse_analysis?.technical_notes,
            )
              ? apiResponse.horse_analysis.technical_notes
              : [],
            athletic_assessment:
              apiResponse.horse_analysis?.athletic_assessment ||
              "Good overall athletic ability.",
          },
          partnership_notes:
            apiResponse.partnership_notes ||
            "Good partnership between horse and rider.",
          safety_observations:
            apiResponse.safety_observations || "No safety concerns observed.",
        };

        setParsedData(normalizedData);
        setParseError("");
      } else {
        setParseError("Could not find JSON data in analysis response");
      }
    } catch (error) {
      setParseError("Failed to parse analysis data");
      console.error("Parse error:", error);
    }
  }, [analysis]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(analysis);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Prepare images for PDF - ensure we have base64 data
      const pdfImages = [];
      if (uploadedImages) {
        for (const img of uploadedImages) {
          let base64 = img.base64;
          if (!base64 && img.file) {
            // Convert to base64 if not already available
            base64 = await convertToBase64(img.file);
          }
          if (base64) {
            pdfImages.push({
              base64,
              filename: img.filename || img.file?.name,
              mimeType: img.mimeType || img.file?.type,
            });
          }
        }
      }

      await exportToEnhancedPDF({
        title: name || "Equestrian Analysis Report",
        subtitle: description || "Single Image Analysis Results",
        filename: name
          ? name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "")
          : "equestrian-single-image-analysis",
        analysis: parsedData || ({} as EquestrianAnalysisData),
        images: pdfImages,
      });
    } catch (error) {
      console.error("Failed to export PDF:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate PDF. Please try again.";
      alert(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  if (parseError || !parsedData) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-2xl font-bold">
              🏇 Equestrian Analysis Results
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Raw Data
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                {isExporting ? (
                  "Generating PDF..."
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
              {showResetButton && (
                <Button variant="outline" size="sm" onClick={onReset}>
                  Analyze Another Image
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* PDF Export Content */}
        <div id="single-analysis-content">
          {/* Image Display */}
          {uploadedImages && uploadedImages.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Analyzed Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full max-w-2xl mx-auto">
                  <Image
                    src={uploadedImages[0].previewUrl}
                    alt="Analyzed equestrian image"
                    width={800}
                    height={600}
                    className="w-full h-auto rounded-lg shadow-md object-contain"
                    style={{ maxHeight: "500px" }}
                  />
                  <div className="mt-3 text-center">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      <ImageIcon className="h-3 w-3 mr-1" />
                      {uploadedImages[0].file.name} (
                      {(uploadedImages[0].file.size / 1024).toFixed(1)} KB)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Content */}
          <AnalysisSection title="Analysis Results" icon={Target}>
            {parseError && (
              <div
                className={`border rounded-lg p-4 mb-6 ${
                  parseError.includes("show jumping content") ||
                  parseError.includes("Helio-Hoof analyzer")
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                    : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        parseError.includes("show jumping content") ||
                        parseError.includes("Helio-Hoof analyzer")
                          ? "bg-blue-500"
                          : "bg-amber-500"
                      }`}
                    >
                      <span className="text-white text-xs font-bold">
                        {parseError.includes("show jumping content") ||
                        parseError.includes("Helio-Hoof analyzer")
                          ? "i"
                          : "!"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4
                      className={`font-medium mb-1 ${
                        parseError.includes("show jumping content") ||
                        parseError.includes("Helio-Hoof analyzer")
                          ? "text-blue-800 dark:text-blue-200"
                          : "text-amber-800 dark:text-amber-200"
                      }`}
                    >
                      {parseError.includes("show jumping content") ||
                      parseError.includes("Helio-Hoof analyzer")
                        ? "Invalid Image Type"
                        : "Alternative Format Detected"}
                    </h4>
                    <p
                      className={`text-sm ${
                        parseError.includes("show jumping content") ||
                        parseError.includes("Helio-Hoof analyzer")
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {parseError.includes("show jumping content") ||
                      parseError.includes("Helio-Hoof analyzer")
                        ? parseError
                        : "The analysis was returned in an unstructured format. The complete response is displayed below."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Only show raw response if it's not a validation error */}
            {!(
              parseError &&
              (parseError.includes("show jumping content") ||
                parseError.includes("Helio-Hoof analyzer"))
            ) && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                    {analysis}
                  </div>
                </div>
              </div>
            )}
          </AnalysisSection>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-2xl">🏇</span>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Equestrian Analysis Results
              </CardTitle>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Comprehensive riding and horse performance analysis
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-all duration-200 shadow-sm"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">Copy Data</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-all duration-200 shadow-sm"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="font-medium">Generating...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-medium">Export PDF</span>
                </>
              )}
            </Button>
            {showResetButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 shadow-sm font-medium"
              >
                New Analysis
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Analysis Content for PDF Export */}
      <div id="single-analysis-content">
        {/* Image Display */}
        {uploadedImages && uploadedImages.length > 0 && (
          <Card className="mb-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-sm">
                  <ImageIcon className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Analyzed Image
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full max-w-2xl mx-auto">
                <div className="relative rounded-xl overflow-hidden shadow-xl bg-white dark:bg-gray-800 p-2">
                  <Image
                    src={uploadedImages[0].previewUrl}
                    alt="Analyzed equestrian image"
                    width={800}
                    height={600}
                    className="w-full h-auto rounded-lg object-contain"
                    style={{ maxHeight: "500px" }}
                  />
                  <div className="absolute top-4 right-4">
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-md">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Original
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700">
                    <ImageIcon className="h-4 w-4 mr-2 text-purple-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {uploadedImages[0].file.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      ({(uploadedImages[0].file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scores Overview */}
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-200 dark:border-emerald-800 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
                <Star className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  Performance Scores
                </span>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                  Overall assessment ratings
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 shadow-md border border-white/50 dark:border-gray-700/50">
                <ScoreDisplay
                  score={parsedData.rider_analysis.overall_score}
                  label="Rider Performance"
                />
              </div>
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 shadow-md border border-white/50 dark:border-gray-700/50">
                <ScoreDisplay
                  score={parsedData.horse_analysis.overall_score}
                  label="Horse Performance"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rider Analysis */}
          <AnalysisSection title="Rider Analysis" icon={Target}>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">
                  ✅ Positives
                </h4>
                <ul className="space-y-1">
                  {parsedData.rider_analysis.positives.map((positive) => (
                    <li
                      key={positive}
                      className="text-sm flex items-start gap-2"
                    >
                      <span className="text-green-500 mt-1">•</span>
                      {positive}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-2">
                  🎯 Areas for Improvement
                </h4>
                <ul className="space-y-1">
                  {parsedData.rider_analysis.areas_for_improvement.map(
                    (area) => (
                      <li key={area} className="text-sm flex items-start gap-2">
                        <span className="text-amber-500 mt-1">•</span>
                        {area}
                      </li>
                    ),
                  )}
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-1">
                  🎯 Priority Focus
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {parsedData.rider_analysis.priority_focus}
                </p>
              </div>
            </div>
          </AnalysisSection>

          {/* Horse Analysis */}
          <AnalysisSection title="Horse Analysis" icon={Target}>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">
                  ✅ Positives
                </h4>
                <ul className="space-y-1">
                  {parsedData.horse_analysis.positives.map((positive) => (
                    <li
                      key={positive}
                      className="text-sm flex items-start gap-2"
                    >
                      <span className="text-green-500 mt-1">•</span>
                      {positive}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-purple-700 dark:text-purple-400 mb-2">
                  🔍 Technical Notes
                </h4>
                <ul className="space-y-1">
                  {parsedData.horse_analysis.technical_notes.map((note) => (
                    <li key={note} className="text-sm flex items-start gap-2">
                      <span className="text-purple-500 mt-1">•</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                <h4 className="font-semibold text-purple-700 dark:text-purple-400 mb-1">
                  🏃 Athletic Assessment
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  {parsedData.horse_analysis.athletic_assessment}
                </p>
              </div>
            </div>
          </AnalysisSection>
        </div>

        {/* Partnership & Safety */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnalysisSection title="Partnership Analysis" icon={Users}>
            <p className="text-sm leading-relaxed">
              {parsedData.partnership_notes}
            </p>
          </AnalysisSection>

          <AnalysisSection title="Safety Observations" icon={Shield}>
            <p className="text-sm leading-relaxed">
              {parsedData.safety_observations}
            </p>
          </AnalysisSection>
        </div>
        {/* End of PDF Export Content */}
      </div>
    </div>
  );
}
