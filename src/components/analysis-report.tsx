"use client";

import { EquestrianAnalysis } from "@/components/equestrian-analysis";
import { MultiImageAnalysis } from "@/components/multi-image-analysis";
import type { UploadedImage } from "@/components/image-upload";

interface AnalysisReportProps {
  analysis: string;
  uploadedImages: UploadedImage[];
  onReset: () => void;
  showResetButton?: boolean;
}

/**
 * Unified Full Analysis Report Component
 * This component is used in both the main analysis page and history pages
 * to ensure identical rendering and functionality across the application.
 */
export function AnalysisReport({
  analysis,
  uploadedImages,
  onReset,
  showResetButton = true,
}: AnalysisReportProps) {
  // Determine if this is a multi-image analysis based on JSON structure
  const isMultiImageAnalysis = (analysisText: string): boolean => {
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
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

  // Render appropriate analysis component based on analysis type
  return (
    <div data-testid="analysis-report">
      {isMultiImageAnalysis(analysis) ? (
        <MultiImageAnalysis
          analysis={analysis}
          uploadedImages={uploadedImages}
          onReset={onReset}
          showResetButton={showResetButton}
        />
      ) : (
        <EquestrianAnalysis
          analysis={analysis}
          onReset={onReset}
          showResetButton={showResetButton}
          uploadedImages={uploadedImages}
        />
      )}
    </div>
  );
}