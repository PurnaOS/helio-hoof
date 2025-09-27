import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalysisData {
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

interface PDFTemplateProps {
  title: string;
  subtitle?: string;
  analysis: AnalysisData;
  images: Array<{
    base64: string;
    filename?: string;
    mimeType: string;
  }>;
  timestamp: string;
}

const PDFTemplate = React.forwardRef<HTMLDivElement, PDFTemplateProps>(
  ({ title, subtitle, analysis, images, timestamp }, ref) => {
    return (
      <div ref={ref} className="pdf-template">
        {/* Print-specific styles */}
        <style jsx>{`
          @media print {
            .pdf-template {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              color: #000 !important;
              background: white !important;
            }

            .page-break {
              page-break-before: always;
            }

            .avoid-break {
              page-break-inside: avoid;
              break-inside: avoid;
            }

            .pdf-header {
              text-align: center;
              border-bottom: 2px solid #e5e5e5;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }

            .pdf-footer {
              position: fixed;
              bottom: 0;
              width: 100%;
              background: white;
              border-top: 1px solid #e5e5e5;
              padding: 10px 0;
              text-align: center;
              font-size: 12px;
              color: #666;
            }

            .pdf-content {
              margin-bottom: 60px;
            }

            /* Ensure cards print well */
            .pdf-card {
              border: 1px solid #d1d5db !important;
              box-shadow: none !important;
              background: white !important;
              margin-bottom: 20px;
              page-break-inside: avoid;
              break-inside: avoid;
            }

            /* Score styling for print */
            .score-badge {
              background: #f3f4f6 !important;
              color: #374151 !important;
              border: 1px solid #d1d5db !important;
            }

            /* Positive indicators */
            .positive-text {
              color: #059669 !important;
            }

            /* Improvement indicators */
            .improvement-text {
              color: #dc2626 !important;
            }

            /* Priority text */
            .priority-text {
              color: #2563eb !important;
              font-weight: 600 !important;
            }

            /* Image styling */
            .analysis-image {
              max-width: 100% !important;
              height: auto !important;
              border: 1px solid #e5e5e5 !important;
              border-radius: 8px !important;
              display: block !important;
              margin: 10px auto !important;
            }

            /* Section backgrounds */
            .section-bg-blue {
              background: #eff6ff !important;
              border: 1px solid #dbeafe !important;
            }

            .section-bg-green {
              background: #f0fdf4 !important;
              border: 1px solid #dcfce7 !important;
            }

            .section-bg-yellow {
              background: #fffbeb !important;
              border: 1px solid #fed7aa !important;
            }

            .section-bg-gray {
              background: #f9fafb !important;
              border: 1px solid #e5e7eb !important;
            }
          }

          @page {
            margin: 1.5cm;
            size: A4;
          }
        `}</style>

        {/* Header */}
        <div className="pdf-header">
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          {subtitle && (
            <h2 className="text-lg text-gray-600 mb-2">{subtitle}</h2>
          )}
          <p className="text-sm text-gray-500">Generated on: {timestamp}</p>
        </div>

        <div className="pdf-content">
          {/* Images Section */}
          {images.length > 0 && (
            <Card className="pdf-card avoid-break mb-8">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  📸 Analyzed Image{images.length > 1 ? "s" : ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {images.map((image, index) => (
                    <div
                      key={image.filename || `image-${index}`}
                      className="avoid-break"
                    >
                      <p className="text-sm font-medium mb-3">
                        {image.filename || `Image ${index + 1}`}
                      </p>
                      {/* biome-ignore lint/performance/noImgElement: Required for PDF generation */}
                      <img
                        src={`data:${image.mimeType};base64,${image.base64}`}
                        alt={`Analysis ${index + 1}`}
                        className="analysis-image max-w-4xl"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Scores */}
          <Card className="pdf-card avoid-break">
            <CardHeader>
              <CardTitle className="text-xl">
                ⭐ Overall Assessment Ratings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-8">
                <div className="text-center">
                  <p className="font-semibold mb-3 text-lg">
                    Rider Performance
                  </p>
                  <Badge className="score-badge text-xl px-6 py-3">
                    {analysis.rider_analysis.overall_score}/10
                  </Badge>
                </div>
                <div className="text-center">
                  <p className="font-semibold mb-3 text-lg">
                    Horse Performance
                  </p>
                  <Badge className="score-badge text-xl px-6 py-3">
                    {analysis.horse_analysis.overall_score}/10
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rider Analysis */}
          <Card className="pdf-card avoid-break">
            <CardHeader>
              <CardTitle className="text-xl">🏇 Rider Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Positives */}
              <div className="avoid-break">
                <h3 className="font-semibold positive-text text-lg mb-3">
                  ✓ Positives
                </h3>
                <ul className="space-y-2">
                  {analysis.rider_analysis.positives.map((positive) => (
                    <li
                      key={`positive-${positive.slice(0, 50)}-${positive.length}`}
                      className="text-sm pl-2"
                    >
                      • {positive}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas for Improvement */}
              <div className="avoid-break">
                <h3 className="font-semibold improvement-text text-lg mb-3">
                  ⚠ Areas for Improvement
                </h3>
                <ul className="space-y-2">
                  {analysis.rider_analysis.areas_for_improvement.map((area) => (
                    <li
                      key={`improvement-${area.slice(0, 50)}-${area.length}`}
                      className="text-sm pl-2"
                    >
                      • {area}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Priority Focus */}
              <div className="avoid-break">
                <h3 className="font-semibold priority-text text-lg mb-3">
                  🎯 Priority Focus
                </h3>
                <div className="section-bg-blue p-4 rounded">
                  <p className="text-sm leading-relaxed">
                    {analysis.rider_analysis.priority_focus}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Horse Analysis */}
          <Card className="pdf-card avoid-break">
            <CardHeader>
              <CardTitle className="text-xl">🐎 Horse Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Positives */}
              <div className="avoid-break">
                <h3 className="font-semibold positive-text text-lg mb-3">
                  ✓ Positives
                </h3>
                <ul className="space-y-2">
                  {analysis.horse_analysis.positives.map((positive) => (
                    <li
                      key={`horse-positive-${positive.slice(0, 50)}-${positive.length}`}
                      className="text-sm pl-2"
                    >
                      • {positive}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Technical Notes */}
              <div className="avoid-break">
                <h3 className="font-semibold text-lg mb-3">
                  🔧 Technical Notes
                </h3>
                <ul className="space-y-2">
                  {analysis.horse_analysis.technical_notes.map((note) => (
                    <li
                      key={`technical-${note.slice(0, 50)}-${note.length}`}
                      className="text-sm pl-2"
                    >
                      • {note}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Athletic Assessment */}
              <div className="avoid-break">
                <h3 className="font-semibold text-lg mb-3">
                  🏃 Athletic Assessment
                </h3>
                <div className="section-bg-gray p-4 rounded">
                  <p className="text-sm leading-relaxed">
                    {analysis.horse_analysis.athletic_assessment}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Partnership & Safety */}
          <Card className="pdf-card avoid-break">
            <CardHeader>
              <CardTitle className="text-xl">🤝 Partnership & Safety</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="avoid-break">
                <h3 className="font-semibold text-lg mb-3">
                  Partnership Evaluation
                </h3>
                <div className="section-bg-green p-4 rounded">
                  <p className="text-sm leading-relaxed">
                    {analysis.partnership_notes}
                  </p>
                </div>
              </div>

              <div className="avoid-break">
                <h3 className="font-semibold text-lg mb-3">
                  Safety Observations
                </h3>
                <div className="section-bg-yellow p-4 rounded">
                  <p className="text-sm leading-relaxed">
                    {analysis.safety_observations}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="pdf-footer">
          <p>Helio-Hoof Show Jumping Analyzer</p>
        </div>
      </div>
    );
  },
);

PDFTemplate.displayName = "PDFTemplate";

export default PDFTemplate;
