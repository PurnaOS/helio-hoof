import React from 'react';

export interface EnhancedPDFExportOptions {
  filename?: string;
  title: string;
  subtitle?: string;
  analysis: any; // The parsed analysis data
  images: Array<{
    base64: string;
    filename?: string;
    mimeType: string;
  }>;
  isMultiImage?: boolean;
}

export function generatePDFContent(options: EnhancedPDFExportOptions) {
  const { title, subtitle, analysis, images, isMultiImage = false } = options;
  const timestamp = new Date().toLocaleString();

  // Generate thumbnails HTML
  const thumbnailsHTML = images.length > 0 ? `
    <div style="border-top: 2px solid #f3f4f6; padding-top: 20px;">
      <h3 style="font-weight: 600; margin-bottom: 16px; text-align: center;">Analyzed Images</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; justify-items: center;">
        ${images.map((image, index) => `
          <div style="text-align: center;">
            <img
              src="${image.base64.startsWith('data:') ? image.base64 : `data:${image.mimeType};base64,${image.base64}`}"
              alt="${image.filename || `Thumbnail ${index + 1}`}"
              style="width: 120px; height: 90px; object-fit: cover; border: 2px solid #e5e5e5; border-radius: 6px; display: block; margin: 0 auto 8px auto;"
              onload="console.log('Thumbnail loaded:', '${image.filename || `Image ${index + 1}`}');"
              onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
            />
            <div style="display: none; width: 120px; height: 90px; background: #f3f4f6; border: 2px solid #e5e5e5; border-radius: 6px; margin: 0 auto 8px auto; text-align: center; line-height: 86px; font-size: 12px; color: #6b7280;">
              Failed to load
            </div>
            <p style="font-size: 0.75rem; color: #6b7280; margin: 0; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${image.filename || `Image ${index + 1}`}
            </p>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  // Generate individual image pages with analysis
  const multiImagePagesHTML = isMultiImage && analysis.individual_analyses ?
    analysis.individual_analyses.map((item, index) => {
      const correspondingImage = images[index];
      return `
        <div class="page-break"></div>
        <!-- Image Section -->
        <div class="pdf-card avoid-break" style="margin-bottom: 20px;">
          <div class="card-header">
            <div class="card-title">📸 ${correspondingImage?.filename || `Image ${index + 1}`}</div>
          </div>
          <div class="card-content">
            <div style="text-align: center; padding: 20px;">
              ${correspondingImage ? `
                <img
                  src="${correspondingImage.base64.startsWith('data:') ? correspondingImage.base64 : `data:${correspondingImage.mimeType};base64,${correspondingImage.base64}`}"
                  alt="${correspondingImage.filename || `Analysis image ${index + 1}`}"
                  class="analysis-image"
                  style="max-width: 100%; height: auto; display: block; margin: 0 auto; border: 2px solid #e5e5e5; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                  onload="console.log('Combined page image loaded:', '${correspondingImage.filename || `Image ${index + 1}`}');"
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                />
                <div style="display: none; background: #f3f4f6; padding: 20px; border-radius: 8px; color: #6b7280;">
                  <strong>Image failed to load</strong><br>
                  Filename: ${correspondingImage.filename || `Image ${index + 1}`}<br>
                  Format: ${correspondingImage.mimeType}
                </div>
              ` : `
                <div style="background: #f3f4f6; padding: 40px; border-radius: 8px; color: #6b7280;">
                  <strong>Image ${index + 1} not available</strong>
                </div>
              `}
            </div>
          </div>
        </div>

        <!-- Analysis Section -->
        <div class="pdf-card avoid-break">
          <div class="card-header">
            <div class="card-title">📊 Image ${item.image_number || (index + 1)} Analysis</div>
          </div>
          <div class="card-content space-y-4">
            <div class="grid-2" style="margin-bottom: 20px;">
              <div class="text-center">
                <p style="font-weight: 600; margin-bottom: 8px;">Rider Score</p>
                <span class="score-badge">${item.rider_score}/10</span>
              </div>
              <div class="text-center">
                <p style="font-weight: 600; margin-bottom: 8px;">Horse Score</p>
                <span class="score-badge">${item.horse_score}/10</span>
              </div>
            </div>

            <div class="avoid-break" style="margin-bottom: 16px;">
              <h4 style="font-weight: 600; margin-bottom: 8px;">Key Observations</h4>
              <div class="section-bg-gray">
                <p style="font-size: 0.875rem; line-height: 1.6;">${item.key_observations}</p>
              </div>
            </div>

            <div class="avoid-break" style="margin-bottom: 16px;">
              <h4 class="positive-text" style="margin-bottom: 8px;">✓ Rider Strengths</h4>
              <ul class="space-y-2">
                ${item.rider_strengths.map(strength => `<li style="font-size: 0.875rem;">• ${strength}</li>`).join('')}
              </ul>
            </div>

            <div class="avoid-break" style="margin-bottom: 16px;">
              <h4 class="improvement-text" style="margin-bottom: 8px;">⚠ Areas for Improvement</h4>
              <ul class="space-y-2">
                ${(item.rider_weaknesses || item.improvements || []).map(weakness => `<li style="font-size: 0.875rem;">• ${weakness}</li>`).join('')}
              </ul>
            </div>

            <div class="avoid-break">
              <h4 class="positive-text" style="margin-bottom: 8px;">🐎 Horse Strengths</h4>
              <ul class="space-y-2">
                ${item.horse_strengths.map(strength => `<li style="font-size: 0.875rem;">• ${strength}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      `;
    }).join('') : '';

  // Generate single image page with analysis
  const singleImagePageHTML = !isMultiImage ? `
    <div class="page-break"></div>

    <!-- Single Image Section -->
    ${images.length > 0 ? `
      <div class="pdf-card avoid-break" style="margin-bottom: 20px;">
        <div class="card-header">
          <div class="card-title">📸 ${images[0]?.filename || 'Analyzed Image'}</div>
        </div>
        <div class="card-content">
          <div style="text-align: center; padding: 20px;">
            <img
              src="${images[0].base64.startsWith('data:') ? images[0].base64 : `data:${images[0].mimeType};base64,${images[0].base64}`}"
              alt="${images[0].filename || 'Analysis image'}"
              class="analysis-image"
              style="max-width: 100%; height: auto; display: block; margin: 0 auto; border: 2px solid #e5e5e5; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
              onload="console.log('Single image loaded successfully:', '${images[0].filename || 'Single image'}');"
              onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
            />
            <div style="display: none; background: #f3f4f6; padding: 20px; border-radius: 8px; color: #6b7280;">
              <strong>Image failed to load</strong><br>
              Filename: ${images[0].filename || 'Single image'}<br>
              Format: ${images[0].mimeType}
            </div>
          </div>
        </div>
      </div>
    ` : ''}

    <!-- Single Image Analysis -->
    <div class="pdf-card avoid-break">
      <div class="card-header">
        <div class="card-title">📊 Detailed Analysis</div>
      </div>
      <div class="card-content space-y-6">
        <!-- Performance Scores -->
        <div class="grid-2" style="margin-bottom: 30px;">
          <div class="text-center">
            <p style="font-weight: 600; margin-bottom: 12px; font-size: 1.125rem;">Rider Performance</p>
            <span class="score-badge">${analysis.rider_analysis.overall_score}/10</span>
          </div>
          <div class="text-center">
            <p style="font-weight: 600; margin-bottom: 12px; font-size: 1.125rem;">Horse Performance</p>
            <span class="score-badge">${analysis.horse_analysis.overall_score}/10</span>
          </div>
        </div>

        <!-- Rider Analysis Section -->
        <div class="avoid-break" style="margin-bottom: 24px;">
          <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 16px; color: #1f2937;">🏇 Rider Analysis</h3>

          <div style="margin-bottom: 16px;">
            <h4 class="positive-text" style="font-size: 1.125rem; margin-bottom: 8px;">✓ Positives</h4>
            <ul class="space-y-2">
              ${analysis.rider_analysis.positives.map(positive => `<li style="font-size: 0.875rem;">• ${positive}</li>`).join('')}
            </ul>
          </div>

          <div style="margin-bottom: 16px;">
            <h4 class="improvement-text" style="font-size: 1.125rem; margin-bottom: 8px;">⚠ Areas for Improvement</h4>
            <ul class="space-y-2">
              ${analysis.rider_analysis.areas_for_improvement.map(area => `<li style="font-size: 0.875rem;">• ${area}</li>`).join('')}
            </ul>
          </div>

          <div>
            <h4 class="priority-text" style="font-size: 1.125rem; margin-bottom: 8px;">🎯 Priority Focus</h4>
            <div class="section-bg-blue">
              <p style="font-size: 0.875rem; line-height: 1.6;">
                ${analysis.rider_analysis.priority_focus}
              </p>
            </div>
          </div>
        </div>

        <!-- Horse Analysis Section -->
        <div class="avoid-break" style="margin-bottom: 24px;">
          <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 16px; color: #1f2937;">🐎 Horse Analysis</h3>

          <div style="margin-bottom: 16px;">
            <h4 class="positive-text" style="font-size: 1.125rem; margin-bottom: 8px;">✓ Positives</h4>
            <ul class="space-y-2">
              ${analysis.horse_analysis.positives.map(positive => `<li style="font-size: 0.875rem;">• ${positive}</li>`).join('')}
            </ul>
          </div>

          <div style="margin-bottom: 16px;">
            <h4 style="font-weight: 600; font-size: 1.125rem; margin-bottom: 8px;">🔧 Technical Notes</h4>
            <ul class="space-y-2">
              ${analysis.horse_analysis.technical_notes.map(note => `<li style="font-size: 0.875rem;">• ${note}</li>`).join('')}
            </ul>
          </div>

          <div>
            <h4 style="font-weight: 600; font-size: 1.125rem; margin-bottom: 8px;">🏃 Athletic Assessment</h4>
            <div class="section-bg-gray">
              <p style="font-size: 0.875rem; line-height: 1.6;">
                ${analysis.horse_analysis.athletic_assessment}
              </p>
            </div>
          </div>
        </div>

        <!-- Partnership & Safety Section -->
        <div class="avoid-break">
          <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 16px; color: #1f2937;">🤝 Partnership & Safety</h3>

          <div style="margin-bottom: 16px;">
            <h4 style="font-weight: 600; font-size: 1.125rem; margin-bottom: 8px;">Partnership Evaluation</h4>
            <div class="section-bg-green">
              <p style="font-size: 0.875rem; line-height: 1.6;">
                ${analysis.partnership_notes}
              </p>
            </div>
          </div>

          <div>
            <h4 style="font-weight: 600; font-size: 1.125rem; margin-bottom: 8px;">Safety Observations</h4>
            <div class="section-bg-yellow">
              <p style="font-size: 0.875rem; line-height: 1.6;">
                ${analysis.safety_observations}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ` : '';

  // Generate comparative analysis for multi-image
  const comparativeAnalysisHTML = isMultiImage && analysis.comparative_analysis ? `
    <div class="page-break"></div>
    <div class="pdf-card avoid-break">
      <div class="card-header">
        <div class="card-title">🔄 Comparative Analysis</div>
      </div>
      <div class="card-content space-y-4">
        <div class="avoid-break">
          <h4 style="font-weight: 600; margin-bottom: 8px;">Overall Assessment</h4>
          <div class="section-bg-blue">
            <p style="font-size: 0.875rem; line-height: 1.6;">${analysis.comparative_analysis.overall_assessment}</p>
          </div>
        </div>

        <div class="avoid-break">
          <h4 style="font-weight: 600; margin-bottom: 8px;">Consistency Notes</h4>
          <div class="section-bg-gray">
            <p style="font-size: 0.875rem; line-height: 1.6;">${analysis.comparative_analysis.consistency_notes}</p>
          </div>
        </div>

        <div class="avoid-break">
          <h4 class="positive-text" style="margin-bottom: 8px;">Best Performing Image</h4>
          <div class="section-bg-green">
            <p style="font-size: 0.875rem; line-height: 1.6;">${analysis.comparative_analysis.best_performing_image}</p>
          </div>
        </div>

        <div class="avoid-break">
          <h4 style="font-weight: 600; margin-bottom: 8px;">Development Patterns</h4>
          <div class="section-bg-gray">
            <p style="font-size: 0.875rem; line-height: 1.6;">${analysis.comparative_analysis.development_patterns}</p>
          </div>
        </div>

        <div class="avoid-break">
          <h4 class="priority-text" style="margin-bottom: 8px;">Priority Focus Areas</h4>
          <ul class="space-y-2">
            ${analysis.comparative_analysis.priority_focus_areas.map(area => `<li style="font-size: 0.875rem;">• ${area}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        @page {
            margin: 1.5cm;
            size: A4;
        }

        @media print {
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                color: #000 !important;
                background: white !important;
                line-height: 1.6;
            }

            .page-break {
                page-break-before: always;
                break-before: page;
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

            .pdf-card {
                border: 1px solid #d1d5db;
                border-radius: 8px;
                margin-bottom: 20px;
                page-break-inside: avoid;
                break-inside: avoid;
                background: white;
            }

            .card-header {
                padding: 24px 24px 0 24px;
                border-bottom: 1px solid #f3f4f6;
            }

            .card-content {
                padding: 24px;
            }

            .card-title {
                font-size: 1.25rem;
                font-weight: 600;
                margin-bottom: 16px;
            }

            .score-badge {
                background: #f3f4f6;
                color: #374151;
                border: 1px solid #d1d5db;
                padding: 8px 16px;
                border-radius: 6px;
                display: inline-block;
                font-weight: 600;
                font-size: 1.125rem;
            }

            .positive-text {
                color: #059669;
                font-weight: 600;
            }

            .improvement-text {
                color: #dc2626;
                font-weight: 600;
            }

            .priority-text {
                color: #2563eb;
                font-weight: 600;
            }

            .analysis-image {
                max-width: 100% !important;
                height: auto !important;
                border: 1px solid #e5e5e5 !important;
                border-radius: 8px !important;
                display: block !important;
                margin: 15px auto !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
            }

            img {
                max-width: 100% !important;
                height: auto !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
            }

            .section-bg-blue {
                background: #eff6ff;
                border: 1px solid #dbeafe;
                padding: 16px;
                border-radius: 6px;
            }

            .section-bg-green {
                background: #f0fdf4;
                border: 1px solid #dcfce7;
                padding: 16px;
                border-radius: 6px;
            }

            .section-bg-yellow {
                background: #fffbeb;
                border: 1px solid #fed7aa;
                padding: 16px;
                border-radius: 6px;
            }

            .section-bg-gray {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                padding: 16px;
                border-radius: 6px;
            }

            .grid-2 {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 32px;
            }

            .text-center {
                text-align: center;
            }

            .space-y-2 > * + * {
                margin-top: 8px;
            }

            .space-y-4 > * + * {
                margin-top: 16px;
            }

            .space-y-6 > * + * {
                margin-top: 24px;
            }

            ul {
                padding-left: 0;
                list-style: none;
            }

            li {
                margin-bottom: 4px;
                padding-left: 8px;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="pdf-header">
        <h1 style="font-size: 2rem; font-weight: bold; margin-bottom: 8px;">${title}</h1>
        ${subtitle ? `<h2 style="font-size: 1.125rem; color: #6b7280; margin-bottom: 8px;">${subtitle}</h2>` : ''}
        <p style="font-size: 0.875rem; color: #9ca3af;">Generated on: ${timestamp}</p>
    </div>

    <div class="pdf-content">
        <!-- Overall Scores & Image Thumbnails - First Page -->
        <div class="pdf-card avoid-break">
            <div class="card-header">
                <div class="card-title">⭐ Overall Assessment & Images</div>
            </div>
            <div class="card-content">
                <!-- Performance Scores -->
                ${isMultiImage ? `
                <div class="text-center" style="margin-bottom: 30px;">
                    <p style="font-weight: 600; margin-bottom: 12px; font-size: 1.25rem;">Multi-Image Analysis Summary</p>
                    <p style="color: #6b7280; font-size: 0.875rem;">Individual scores and detailed analysis on following pages</p>
                </div>
                ` : `
                <div class="grid-2" style="margin-bottom: 30px;">
                    <div class="text-center">
                        <p style="font-weight: 600; margin-bottom: 12px; font-size: 1.125rem;">Rider Performance</p>
                        <span class="score-badge">${analysis.rider_analysis?.overall_score || 'N/A'}/10</span>
                    </div>
                    <div class="text-center">
                        <p style="font-weight: 600; margin-bottom: 12px; font-size: 1.125rem;">Horse Performance</p>
                        <span class="score-badge">${analysis.horse_analysis?.overall_score || 'N/A'}/10</span>
                    </div>
                </div>
                `}

                <!-- Image Thumbnails -->
                ${thumbnailsHTML}
            </div>
        </div>

        ${multiImagePagesHTML}
        ${singleImagePageHTML}
        ${comparativeAnalysisHTML}
    </div>

    <!-- Footer -->
    <div style="position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e5e5e5; padding: 10px 0; background: white;">
        Helio-Hoof Show Jumping Analyzer
    </div>
</body>
</html>`;
}

export async function exportToEnhancedPDF(options: EnhancedPDFExportOptions): Promise<void> {
  const { filename = 'equestrian-analysis-report', images } = options;

  // Debug image data
  console.log('PDF Export Debug:', {
    imageCount: images.length,
    imageDetails: images.map((img, i) => {
      const finalSrc = img.base64?.startsWith('data:') ? img.base64 : `data:${img.mimeType};base64,${img.base64}`;
      return {
        index: i,
        filename: img.filename,
        mimeType: img.mimeType,
        base64Length: img.base64?.length || 0,
        hasDataPrefix: img.base64?.startsWith('data:') || false,
        finalSrcPreview: finalSrc?.substring(0, 60) + '...',
        finalSrcLength: finalSrc?.length || 0
      };
    })
  });

  // Generate the HTML content
  const htmlContent = generatePDFContent(options);

  // Create a temporary window to print the content
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Unable to open print window. Please check your browser popup settings.');
  }

  // Write the HTML content to the new window
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for the content to load, then trigger print
  printWindow.onload = () => {
    // Set the document title for the PDF filename
    printWindow.document.title = `${filename}-${new Date().toISOString().split('T')[0]}`;

    // Trigger the print dialog
    printWindow.print();

    // Clean up - close the window after printing
    setTimeout(() => {
      printWindow.close();
    }, 1000);
  };
}

// Alternative function using react-to-print approach for React components
export async function printReactComponent(
  componentRef: React.RefObject<HTMLDivElement>,
  filename?: string
): Promise<void> {
  if (!componentRef.current) {
    throw new Error('Component reference is not available');
  }

  const printContent = componentRef.current.innerHTML;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Unable to open print window. Please check your browser popup settings.');
  }

  const finalFilename = `${filename || 'equestrian-analysis-report'}-${new Date().toISOString().split('T')[0]}`;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>${finalFilename}</title>
        <style>
            @page {
                margin: 1.5cm;
                size: A4;
            }

            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                color: #000;
                background: white;
                line-height: 1.6;
            }

            /* Import existing styles from the component */
            ${getComputedStyle(componentRef.current).cssText}
        </style>
    </head>
    <body>
        ${printContent}
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.print();

  setTimeout(() => {
    printWindow.close();
  }, 1000);
}