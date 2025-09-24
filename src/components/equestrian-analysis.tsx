"use client";

import {
  CheckCircle2,
  Copy,
  Download,
  Shield,
  Star,
  Target,
  Users,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportToPDF } from "@/lib/pdf-export";
import type { UploadedImage } from "@/components/image-upload";

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

interface EquestrianAnalysisProps {
  analysis: string;
  onReset: () => void;
  showResetButton?: boolean;
  uploadedImages?: UploadedImage[];
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

export function EquestrianAnalysis({
  analysis,
  onReset,
  showResetButton = true,
  uploadedImages = [],
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
      let parsed: any = null;

      // Try parsing entire response as JSON first
      try {
        parsed = JSON.parse(analysis);
      } catch {
        // Extract JSON from text using regex
        const jsonMatch = analysis.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      }

      if (parsed && typeof parsed === "object") {
        // Create normalized structure with defaults
        const normalizedData: EquestrianAnalysisData = {
          rider_analysis: {
            overall_score: Number(parsed.rider_analysis?.overall_score || 0),
            positives: Array.isArray(parsed.rider_analysis?.positives) ? parsed.rider_analysis.positives : [],
            areas_for_improvement: Array.isArray(parsed.rider_analysis?.areas_for_improvement) ? parsed.rider_analysis.areas_for_improvement : [],
            priority_focus: parsed.rider_analysis?.priority_focus || "Focus on core fundamentals and position.",
          },
          horse_analysis: {
            overall_score: Number(parsed.horse_analysis?.overall_score || 0),
            positives: Array.isArray(parsed.horse_analysis?.positives) ? parsed.horse_analysis.positives : [],
            technical_notes: Array.isArray(parsed.horse_analysis?.technical_notes) ? parsed.horse_analysis.technical_notes : [],
            athletic_assessment: parsed.horse_analysis?.athletic_assessment || "Good overall athletic ability.",
          },
          partnership_notes: parsed.partnership_notes || "Good partnership between horse and rider.",
          safety_observations: parsed.safety_observations || "No safety concerns observed.",
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
      await exportToPDF({
        elementId: "single-analysis-content",
        title: "Equestrian Analysis Report",
        subtitle: "Single Image Analysis Results",
        filename: "equestrian-single-image-analysis",
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
                    style={{ maxHeight: '500px' }}
                  />
                  <div className="mt-3 text-center">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      <ImageIcon className="h-3 w-3 mr-1" />
                      {uploadedImages[0].file.name} ({(uploadedImages[0].file.size / 1024).toFixed(1)} KB)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Content */}
          <AnalysisSection title="Analysis Results" icon={Target}>
            {parseError && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                      Alternative Format Detected
                    </h4>
                    <p className="text-amber-700 dark:text-amber-300 text-sm">
                      The analysis was returned in an unstructured format. The complete response is displayed below.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                  {analysis}
                </div>
              </div>
            </div>
          </AnalysisSection>
        </div>
      </div>
    );
  }

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

      {/* Analysis Content for PDF Export */}
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
                  style={{ maxHeight: '500px' }}
                />
                <div className="mt-3 text-center">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    <ImageIcon className="h-3 w-3 mr-1" />
                    {uploadedImages[0].file.name} ({(uploadedImages[0].file.size / 1024).toFixed(1)} KB)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scores Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Performance Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ScoreDisplay
                score={parsedData.rider_analysis.overall_score}
                label="Rider Performance"
              />
              <ScoreDisplay
                score={parsedData.horse_analysis.overall_score}
                label="Horse Performance"
              />
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
