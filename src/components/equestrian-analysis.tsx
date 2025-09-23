"use client";

import {
  CheckCircle2,
  Copy,
  Download,
  Shield,
  Star,
  Target,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportToPDF } from "@/lib/pdf-export";

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
      // Try to extract JSON from the analysis text
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr) as EquestrianAnalysisData;
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
      <div className="w-full max-w-4xl mx-auto space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl font-semibold">
              Analysis Results
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
                Analyze Another Image
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
            <Button variant="outline" size="sm" onClick={onReset}>
              Analyze Another Image
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Analysis Content for PDF Export */}
      <div id="single-analysis-content">
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
