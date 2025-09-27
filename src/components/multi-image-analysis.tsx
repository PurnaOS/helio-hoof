"use client";

import {
  Award,
  CheckCircle2,
  Copy,
  Download,
  Shield,
  Star,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import type { UploadedImage } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportToEnhancedPDF } from "@/lib/enhanced-pdf-export";
import { convertToBase64 } from "@/lib/utils";

interface IndividualAnalysis {
  image_number: number;
  rider_score: number;
  horse_score: number;
  key_observations: string;
  rider_strengths: string[];
  rider_weaknesses: string[];
  horse_strengths: string[];
  improvements: string[];
  [key: string]: unknown;
}

interface ComparativeAnalysis {
  overall_assessment: string;
  consistency_notes: string;
  best_performing_image: string;
  development_patterns: string;
  priority_focus_areas: string[];
}

interface MultiImageAnalysisData {
  individual_analyses: IndividualAnalysis[];
  comparative_analysis: ComparativeAnalysis;
  partnership_evaluation: string;
  safety_observations: string;
  [key: string]: unknown;
}

interface MultiImageApiResponse {
  all_show_jumping?: boolean;
  show_jumping_count?: number;
  individual_analyses?: IndividualAnalysis[];
  comparative_analysis?: ComparativeAnalysis;
  partnership_evaluation?: string;
  safety_observations?: string;
}

interface MultiImageAnalysisProps {
  analysis: string;
  uploadedImages: UploadedImage[];
  onReset: () => void;
  showResetButton?: boolean;
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
      <Star className={`h-4 w-4 ${getScoreColor(score)}`} />
      <span className="text-sm font-medium">{label}:</span>
      <span className={`text-lg font-bold ${getScoreColor(score)}`}>
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
    if (title.includes("Comparative")) {
      return {
        bg: "from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950",
        border: "border-cyan-200 dark:border-cyan-800",
        iconBg: "from-cyan-500 to-blue-500",
        textColor: "text-cyan-600 dark:text-cyan-400",
      };
    } else if (title.includes("Priority") || title.includes("Focus")) {
      return {
        bg: "from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950",
        border: "border-orange-200 dark:border-orange-800",
        iconBg: "from-orange-500 to-red-500",
        textColor: "text-orange-600 dark:text-orange-400",
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
      bg: "from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950",
      border: "border-emerald-200 dark:border-emerald-800",
      iconBg: "from-emerald-500 to-teal-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
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

export function MultiImageAnalysis({
  analysis,
  uploadedImages,
  onReset,
  showResetButton = true,
  name,
  description,
}: MultiImageAnalysisProps) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [parsedData, setParsedData] = useState<MultiImageAnalysisData | null>(
    null,
  );
  const [parseError, setParseError] = useState<string>("");

  // Parse JSON from analysis on component mount
  React.useEffect(() => {
    try {
      // Try multiple strategies to extract JSON from the analysis text
      let parsed: unknown = null;
      let jsonStr = "";

      console.log(
        "🔍 Multi-image: Raw analysis received:",
        analysis.substring(0, 300) + (analysis.length > 300 ? "..." : ""),
      );

      // Strategy 1: Try parsing the entire response as JSON (for clean responses)
      try {
        parsed = JSON.parse(analysis);
        jsonStr = analysis;
      } catch {
        // Strategy 2: Extract JSON from text using regex
        const jsonMatch = analysis.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            jsonStr = jsonMatch[0];
            parsed = JSON.parse(jsonStr);
          } catch (parseError) {
            console.log("Strategy 2 failed to parse matched JSON:", parseError);
            // Continue to strategy 3
          }
        }

        // Strategy 3: Look for JSON between code blocks or markers (only if strategy 2 failed)
        if (!parsed) {
          const codeBlockMatch = analysis.match(
            /```(?:json)?\s*(\{[\s\S]*?\})\s*```/i,
          );
          if (codeBlockMatch) {
            try {
              jsonStr = codeBlockMatch[1];
              parsed = JSON.parse(jsonStr);
            } catch (parseError) {
              console.log(
                "Strategy 3 failed to parse matched JSON:",
                parseError,
              );
              // All strategies failed, will be handled by outer error handling
            }
          }
        }
      }

      if (parsed && typeof parsed === "object") {
        // Debug logging to understand the structure
        console.log("Multi-image: Successfully parsed JSON data:", parsed);
        console.log("Multi-image: Data keys:", Object.keys(parsed));

        // Check if this contains non-show jumping images
        const apiResponse = parsed as MultiImageApiResponse;
        if (apiResponse.all_show_jumping === false) {
          const validCount = apiResponse.show_jumping_count || 0;
          const totalImages = uploadedImages?.length || 0;
          const invalidCount = totalImages - validCount;

          if (validCount === 0) {
            setParseError(
              "None of the uploaded images contain show jumping content suitable for analysis. Please upload images showing horses and riders jumping over fences or obstacles.",
            );
            return;
          } else {
            setParseError(
              `${invalidCount} of ${totalImages} images do not show show jumping content. Analysis provided for ${validCount} valid image${validCount !== 1 ? "s" : ""}.`,
            );
          }
        }

        // Validate that the parsed data has the expected structure for show jumping analysis
        if (
          (Array.isArray(apiResponse.individual_analyses) &&
            apiResponse.individual_analyses.length > 0 &&
            apiResponse.comparative_analysis &&
            typeof apiResponse.comparative_analysis === "object") ||
          (apiResponse.all_show_jumping === false &&
            Array.isArray(apiResponse.individual_analyses))
        ) {
          setParsedData(parsed as MultiImageAnalysisData);
          if (apiResponse.all_show_jumping !== false) {
            setParseError("");
          }
        } else {
          setParseError(
            "Multi-image analysis data structure is incomplete or invalid",
          );
        }
      } else {
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
            "The analysis response could not be processed. Please try uploading your images again.",
          );
        }
      }
    } catch (error) {
      setParseError("Failed to parse analysis data");
      console.error("Parse error:", error);
    }
  }, [analysis, uploadedImages?.length]);

  // Cleanup blob URLs when component unmounts
  React.useEffect(() => {
    return () => {
      uploadedImages.forEach((image) => {
        if (image.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(image.previewUrl);
        }
      });
    };
  }, [uploadedImages]);

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
      for (const img of uploadedImages) {
        let base64 = img.base64;
        if (!base64 && img.file) {
          // Convert to base64 if not already available
          console.log("Converting file to base64:", img.file?.name);
          base64 = await convertToBase64(img.file);
        }

        console.log("Image data for PDF:", {
          filename: img.filename || img.file?.name,
          mimeType: img.mimeType || img.file?.type,
          base64Length: base64?.length || 0,
          hasBase64: !!base64,
          hasDataPrefix: base64?.startsWith("data:") || false,
        });

        if (base64) {
          pdfImages.push({
            base64,
            filename: img.filename || img.file?.name,
            mimeType: img.mimeType || img.file?.type,
          });
        }
      }

      await exportToEnhancedPDF({
        title: name || "Equestrian Analysis Report",
        subtitle:
          description ||
          `Multi-Image Analysis Results (${uploadedImages.length} Images)`,
        filename: name
          ? name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "")
          : "equestrian-multi-image-analysis",
        analysis: parsedData || ({} as MultiImageAnalysisData),
        images: pdfImages,
        isMultiImage: true,
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
      <div className="w-full max-w-4xl mx-auto space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl font-semibold">
              Multi-Image Analysis Results
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
                    Copy
                  </>
                )}
              </Button>
              <div className="flex gap-1">
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
                {/* Cancel export functionality not implemented */}
              </div>
              {showResetButton && (
                <Button variant="outline" size="sm" onClick={onReset}>
                  Analyze More Images
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {parseError && (
              <div
                className={`border rounded-lg p-4 mb-4 ${
                  parseError.includes("show jumping content") ||
                  parseError.includes("Helio-Hoof analyzer")
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                    : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        parseError.includes("show jumping content") ||
                        parseError.includes("Helio-Hoof analyzer")
                          ? "bg-blue-500"
                          : "bg-yellow-500"
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
                          : "text-yellow-800 dark:text-yellow-200"
                      }`}
                    >
                      {parseError.includes("show jumping content") ||
                      parseError.includes("Helio-Hoof analyzer")
                        ? "Invalid Image Content"
                        : "Analysis Error"}
                    </h4>
                    <p
                      className={`text-sm ${
                        parseError.includes("show jumping content") ||
                        parseError.includes("Helio-Hoof analyzer")
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-yellow-700 dark:text-yellow-300"
                      }`}
                    >
                      {parseError.includes("show jumping content") ||
                      parseError.includes("Helio-Hoof analyzer")
                        ? parseError
                        : `${parseError}. Showing raw response:`}
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
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                  {analysis}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950 border-violet-200 dark:border-violet-800 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-2xl">🏇</span>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-violet-700 to-purple-700 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
                Multi-Image Analysis Results
              </CardTitle>
              <p className="text-sm text-violet-600 dark:text-violet-400 mt-1">
                Comprehensive analysis across multiple images
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 border-violet-200 dark:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/50 transition-all duration-200 shadow-sm"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <span className="font-medium">Copy Data</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/50 transition-all duration-200 shadow-sm"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <span className="font-medium">Generating...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 text-purple-600 dark:text-purple-400" />
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
      <div id="multi-analysis-content">
        {/* Individual Image Analyses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Individual Image Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {parsedData.individual_analyses.map((imageAnalysis) => {
                const correspondingImage =
                  uploadedImages[imageAnalysis.image_number - 1];
                return (
                  <Card
                    key={imageAnalysis.image_number}
                    className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-800 border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-gray-600 rounded-lg flex items-center justify-center shadow-sm">
                          <span className="text-white font-bold text-sm">
                            {imageAnalysis.image_number}
                          </span>
                        </div>
                        <div>
                          <span className="font-bold text-gray-800 dark:text-gray-200">
                            Image {imageAnalysis.image_number}
                          </span>
                          <div className="h-1 w-12 bg-gradient-to-r from-slate-600 to-gray-600 rounded-full mt-1"></div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Display the uploaded image */}
                      {correspondingImage && (
                        <div className="relative">
                          <div className="relative rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 p-2">
                            <Image
                              src={correspondingImage.previewUrl}
                              alt={`Analysis image ${imageAnalysis.image_number}`}
                              className="w-full h-auto object-contain rounded-lg max-h-64"
                              width={400}
                              height={300}
                              style={{ aspectRatio: "auto" }}
                            />
                            <div className="absolute top-2 right-2">
                              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  #{imageAnalysis.image_number}
                                </span>
                              </div>
                            </div>
                            <div className="absolute bottom-2 left-2 right-2">
                              <div className="bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full truncate">
                                {correspondingImage.file.name}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Scores */}
                      <div className="grid grid-cols-2 gap-4">
                        <ScoreDisplay
                          score={imageAnalysis.rider_score}
                          label="Rider"
                        />
                        <ScoreDisplay
                          score={imageAnalysis.horse_score}
                          label="Horse"
                        />
                      </div>

                      {/* Key Observations */}
                      <div>
                        <h5 className="font-medium text-sm mb-1">
                          Key Observations:
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {imageAnalysis.key_observations}
                        </p>
                      </div>

                      {/* Rider Analysis */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-green-700 dark:text-green-400 text-sm mb-1">
                            👤 Rider Strengths
                          </h5>
                          <ul className="space-y-1">
                            {imageAnalysis.rider_strengths.map((strength) => (
                              <li
                                key={strength}
                                className="text-xs flex items-start gap-1"
                              >
                                <span className="text-green-500 mt-0.5">•</span>
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-medium text-red-700 dark:text-red-400 text-sm mb-1">
                            👤 Rider Weaknesses
                          </h5>
                          <ul className="space-y-1">
                            {imageAnalysis.rider_weaknesses.map((weakness) => (
                              <li
                                key={weakness}
                                className="text-xs flex items-start gap-1"
                              >
                                <span className="text-red-500 mt-0.5">•</span>
                                {weakness}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Horse Strengths */}
                      <div>
                        <h5 className="font-medium text-blue-700 dark:text-blue-400 text-sm mb-1">
                          🐎 Horse Strengths
                        </h5>
                        <ul className="space-y-1">
                          {imageAnalysis.horse_strengths.map((strength) => (
                            <li
                              key={strength}
                              className="text-xs flex items-start gap-1"
                            >
                              <span className="text-blue-500 mt-0.5">•</span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Improvements */}
                      <div>
                        <h5 className="font-medium text-amber-700 dark:text-amber-400 text-sm mb-1">
                          🎯 Areas for Improvement
                        </h5>
                        <ul className="space-y-1">
                          {imageAnalysis.improvements.map((improvement) => (
                            <li
                              key={improvement}
                              className="text-xs flex items-start gap-1"
                            >
                              <span className="text-amber-500 mt-0.5">•</span>
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Comparative Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnalysisSection title="Comparative Analysis" icon={TrendingUp}>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">
                  📊 Overall Assessment
                </h4>
                <p className="text-sm leading-relaxed">
                  {parsedData.comparative_analysis.overall_assessment}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-purple-700 dark:text-purple-400 mb-2">
                  🔄 Consistency Notes
                </h4>
                <p className="text-sm leading-relaxed">
                  {parsedData.comparative_analysis.consistency_notes}
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <h4 className="font-semibold text-green-700 dark:text-green-400 mb-1">
                  🏆 Best Performing Image
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {parsedData.comparative_analysis.best_performing_image}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-indigo-700 dark:text-indigo-400 mb-2">
                  📈 Development Patterns
                </h4>
                <p className="text-sm leading-relaxed">
                  {parsedData.comparative_analysis.development_patterns}
                </p>
              </div>
            </div>
          </AnalysisSection>

          <AnalysisSection title="Priority Focus Areas" icon={Award}>
            <div className="space-y-3">
              <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2">
                🎯 Key Areas to Work On
              </h4>
              <ul className="space-y-2">
                {parsedData.comparative_analysis.priority_focus_areas.map(
                  (area) => (
                    <li
                      key={area}
                      className="text-sm flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded"
                    >
                      <span className="text-red-500 mt-1">•</span>
                      {area}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </AnalysisSection>
        </div>

        {/* Partnership & Safety */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnalysisSection title="Partnership Evaluation" icon={Users}>
            <p className="text-sm leading-relaxed">
              {parsedData.partnership_evaluation}
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
