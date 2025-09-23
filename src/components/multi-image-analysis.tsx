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
import { exportToPDF } from "@/lib/pdf-export";

interface IndividualAnalysis {
  image_number: number;
  rider_score: number;
  horse_score: number;
  key_observations: string;
  rider_strengths: string[];
  rider_weaknesses: string[];
  horse_strengths: string[];
  improvements: string[];
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
}

interface MultiImageAnalysisProps {
  analysis: string;
  uploadedImages: UploadedImage[];
  onReset: () => void;
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
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function MultiImageAnalysis({
  analysis,
  uploadedImages,
  onReset,
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
      // Try to extract JSON from the analysis text
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr) as MultiImageAnalysisData;
        setParsedData(parsed);
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
      await exportToPDF({
        elementId: "multi-analysis-content",
        title: "Equestrian Analysis Report",
        subtitle: `Multi-Image Analysis Results (${uploadedImages.length} Images)`,
        filename: "equestrian-multi-image-analysis",
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
              <Button variant="outline" size="sm" onClick={onReset}>
                Analyze More Images
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {parseError && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  {parseError}. Showing raw response:
                </p>
              </div>
            )}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                {analysis}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold">
            🏇 Multi-Image Equestrian Analysis Results
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
            <Button variant="outline" size="sm" onClick={onReset}>
              Analyze More Images
            </Button>
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
                  <Card key={imageAnalysis.image_number} className="border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">
                        Image {imageAnalysis.image_number}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Display the uploaded image */}
                      {correspondingImage && (
                        <div className="relative">
                          <Image
                            src={correspondingImage.previewUrl}
                            alt={`Analysis image ${imageAnalysis.image_number}`}
                            className="w-full h-48 object-cover rounded-lg bg-gray-50 dark:bg-gray-900"
                            width={400}
                            height={192}
                          />
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="bg-black/70 text-white text-xs px-2 py-1 rounded truncate">
                              {correspondingImage.file.name}
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
