import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export interface PDFExportOptions {
  filename?: string;
  elementId: string;
  title: string;
  subtitle?: string;
}

export async function exportToPDF({
  filename = "equestrian-analysis-report",
  elementId,
  title,
  subtitle,
}: PDFExportOptions): Promise<void> {
  let tempStyleSheet: HTMLStyleElement | null = null;
  let originalStyles: Map<Element, string> | null = null;

  try {
    console.log(`Starting PDF export for element: ${elementId}`);

    // Check if we're in a browser environment
    if (typeof window === "undefined" || typeof document === "undefined") {
      throw new Error("PDF generation is only available in the browser");
    }

    // Get the element to export
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with id "${elementId}" not found`);
      throw new Error(`Element with id "${elementId}" not found`);
    }

    console.log("Element found, checking dimensions...");
    const rect = element.getBoundingClientRect();
    console.log(`Element dimensions: ${rect.width}x${rect.height}`);

    if (rect.width === 0 || rect.height === 0) {
      throw new Error("Element has zero dimensions - cannot generate PDF");
    }

    // Wait a moment for any dynamic content to load
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Pre-emptively fix lab colors in the actual DOM before html2canvas processes it
    console.log("Pre-processing DOM to remove lab colors...");
    tempStyleSheet = document.createElement("style");
    tempStyleSheet.id = "pdf-export-temp-styles";
    tempStyleSheet.textContent = `
      /* Force override all possible lab/modern color sources */
      * {
        color: rgb(0, 0, 0) !important;
        background-color: transparent !important;
        border-color: rgb(0, 0, 0) !important;
        outline-color: rgb(0, 0, 0) !important;
        text-decoration-color: rgb(0, 0, 0) !important;
        fill: rgb(0, 0, 0) !important;
        stroke: rgb(0, 0, 0) !important;
      }

      .bg-white, [class*="bg-white"] { background-color: rgb(255, 255, 255) !important; }
      .bg-background { background-color: rgb(255, 255, 255) !important; }
      .bg-card { background-color: rgb(255, 255, 255) !important; }
      .text-foreground { color: rgb(0, 0, 0) !important; }
      .text-card-foreground { color: rgb(0, 0, 0) !important; }
      .text-muted-foreground { color: rgb(115, 115, 115) !important; }
      .text-green-600, [class*="text-green"] { color: rgb(34, 197, 94) !important; }
      .text-yellow-600, [class*="text-yellow"] { color: rgb(202, 138, 4) !important; }
      .text-red-600, [class*="text-red"] { color: rgb(220, 38, 38) !important; }
      .text-blue-600, [class*="text-blue"] { color: rgb(37, 99, 235) !important; }
      .text-purple-600, [class*="text-purple"] { color: rgb(147, 51, 234) !important; }
      .text-gray-600, [class*="text-gray"] { color: rgb(75, 85, 99) !important; }
      .border, [class*="border"] { border-color: rgb(229, 231, 235) !important; }
      .border-border { border-color: rgb(229, 231, 235) !important; }
    `;
    document.head.appendChild(tempStyleSheet);

    // Also directly modify inline styles of problematic elements
    const allElements = element.getElementsByTagName("*");
    originalStyles = new Map<Element, string>();

    Array.from(allElements).forEach((el, index) => {
      const htmlEl = el as HTMLElement;
      // Store original style for restoration
      if (originalStyles) {
        originalStyles.set(el, htmlEl.style.cssText);
      }

      try {
        const computedStyle = getComputedStyle(el);

        // Check all color properties for modern color functions and log them
        const properties = [
          "color",
          "backgroundColor",
          "borderColor",
          "borderTopColor",
          "borderRightColor",
          "borderBottomColor",
          "borderLeftColor",
          "outlineColor",
          "textDecorationColor",
          "fill",
          "stroke",
        ];

        properties.forEach((prop) => {
          const value = computedStyle.getPropertyValue(prop);
          if (
            value &&
            (value.includes("lab(") ||
              value.includes("lch(") ||
              value.includes("oklch("))
          ) {
            console.warn(
              `Found modern color function in element ${index} ${el.tagName}.${el.className}: ${prop} = ${value}`,
            );
          }
        });

        // Force set inline styles to override any lab colors
        if (
          computedStyle.color &&
          (computedStyle.color.includes("lab(") ||
            computedStyle.color.includes("lch(") ||
            computedStyle.color.includes("oklch("))
        ) {
          htmlEl.style.setProperty("color", "rgb(0, 0, 0)", "important");
        }
        if (
          computedStyle.backgroundColor &&
          (computedStyle.backgroundColor.includes("lab(") ||
            computedStyle.backgroundColor.includes("lch(") ||
            computedStyle.backgroundColor.includes("oklch("))
        ) {
          htmlEl.style.setProperty(
            "background-color",
            "rgb(255, 255, 255)",
            "important",
          );
        }
        if (
          computedStyle.borderColor &&
          (computedStyle.borderColor.includes("lab(") ||
            computedStyle.borderColor.includes("lch(") ||
            computedStyle.borderColor.includes("oklch("))
        ) {
          htmlEl.style.setProperty("border-color", "rgb(0, 0, 0)", "important");
        }
      } catch (_e) {
        // Fallback to safe defaults if anything fails
        htmlEl.style.setProperty("color", "rgb(0, 0, 0)", "important");
        htmlEl.style.setProperty(
          "background-color",
          "transparent",
          "important",
        );
        htmlEl.style.setProperty("border-color", "rgb(0, 0, 0)", "important");
      }
    });

    console.log("Creating canvas from HTML element...");

    // Create canvas from HTML element with improved options
    const canvas = await html2canvas(element, {
      scale: 1.5, // Reduced scale to prevent memory issues
      useCORS: true,
      allowTaint: false, // Changed to false for better compatibility
      backgroundColor: "#ffffff",
      removeContainer: false, // Changed to false
      logging: false, // Disable logging to reduce console noise
      imageTimeout: 15000, // Increased timeout for images
      ignoreElements: (element) => {
        // Skip elements that might have problematic CSS
        const style = getComputedStyle(element);
        return style.display === "none" || style.visibility === "hidden";
      },
      foreignObjectRendering: false, // Disable foreign object rendering to avoid modern CSS issues
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        try {
          // Fix problematic CSS in the cloned document
          const style = clonedDoc.createElement("style");
          style.textContent = `
            /* Override any modern CSS color functions with safe RGB values */
            * {
              color: rgb(0, 0, 0) !important;
              background-color: transparent !important;
              border-color: rgb(0, 0, 0) !important;
              outline-color: rgb(0, 0, 0) !important;
              text-decoration-color: rgb(0, 0, 0) !important;
            }

            /* Ensure all CSS custom properties resolve to RGB */
            :root {
              --background: rgb(255, 255, 255) !important;
              --foreground: rgb(0, 0, 0) !important;
              --muted: rgb(245, 245, 245) !important;
              --muted-foreground: rgb(115, 115, 115) !important;
              --card: rgb(255, 255, 255) !important;
              --card-foreground: rgb(0, 0, 0) !important;
              --border: rgb(229, 231, 235) !important;
              --input: rgb(229, 231, 235) !important;
              --primary: rgb(0, 0, 0) !important;
              --primary-foreground: rgb(255, 255, 255) !important;
              --secondary: rgb(245, 245, 245) !important;
              --secondary-foreground: rgb(0, 0, 0) !important;
              --accent: rgb(245, 245, 245) !important;
              --accent-foreground: rgb(0, 0, 0) !important;
              --destructive: rgb(239, 68, 68) !important;
              --destructive-foreground: rgb(255, 255, 255) !important;
              --ring: rgb(147, 197, 253) !important;
            }

            .bg-white, [class*="bg-white"] {
              background-color: rgb(255, 255, 255) !important;
            }
            .bg-background {
              background-color: rgb(255, 255, 255) !important;
            }
            .text-foreground {
              color: rgb(0, 0, 0) !important;
            }
            .text-green-600, [class*="text-green"] {
              color: rgb(34, 197, 94) !important;
            }
            .text-yellow-600, [class*="text-yellow"] {
              color: rgb(202, 138, 4) !important;
            }
            .text-red-600, [class*="text-red"] {
              color: rgb(220, 38, 38) !important;
            }
            .text-blue-600, [class*="text-blue"] {
              color: rgb(37, 99, 235) !important;
            }
            .text-purple-600, [class*="text-purple"] {
              color: rgb(147, 51, 234) !important;
            }
            .text-gray-600, [class*="text-gray"] {
              color: rgb(75, 85, 99) !important;
            }
            .text-muted-foreground {
              color: rgb(115, 115, 115) !important;
            }
            .border, [class*="border"] {
              border-color: rgb(229, 231, 235) !important;
            }
            .border-border {
              border-color: rgb(229, 231, 235) !important;
            }

            /* Force all card backgrounds to be white */
            .bg-card {
              background-color: rgb(255, 255, 255) !important;
            }
            .text-card-foreground {
              color: rgb(0, 0, 0) !important;
            }
          `;

          // Safely append style to head with fallbacks
          if (clonedDoc.head) {
            clonedDoc.head.appendChild(style);
          } else if (clonedDoc.documentElement) {
            // If no head, create one
            const head = clonedDoc.createElement("head");
            head.appendChild(style);
            clonedDoc.documentElement.insertBefore(
              head,
              clonedDoc.documentElement.firstChild,
            );
          } else {
            console.warn(
              "Cannot inject CSS: cloned document has no head or documentElement",
            );
          }

          // Ensure all images are visible in the cloned document
          const images = clonedDoc.getElementsByTagName("img");
          Array.from(images).forEach((img) => {
            img.style.display = "block";
            img.style.visibility = "visible";
          });

          // Apply inline styles directly to elements as backup
          const allElements = clonedDoc.getElementsByTagName("*");
          Array.from(allElements).forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.style) {
              try {
                // Force RGB colors on all elements
                const computedStyle =
                  clonedDoc.defaultView?.getComputedStyle(el);
                if (computedStyle) {
                  // Convert any modern CSS colors (lab, lch, oklch, color-mix) to basic colors
                  const modernColorFunctions = [
                    "lab(",
                    "lch(",
                    "oklch(",
                    "color-mix(",
                    "color(",
                  ];

                  // Helper function to convert modern colors to RGB fallback
                  const convertModernColor = (
                    colorValue: string,
                    fallback: string,
                  ): string => {
                    if (
                      !colorValue ||
                      colorValue === "transparent" ||
                      colorValue === "inherit" ||
                      colorValue === "initial"
                    ) {
                      return colorValue;
                    }

                    // Check if color contains modern color functions
                    for (const modernFunc of modernColorFunctions) {
                      if (colorValue.includes(modernFunc)) {
                        return fallback;
                      }
                    }

                    // Also handle CSS custom properties that might resolve to modern colors
                    if (colorValue.includes("var(")) {
                      // Try to create a temporary element to resolve the color
                      try {
                        const tempEl = clonedDoc.createElement("div");
                        tempEl.style.color = colorValue;
                        clonedDoc.body?.appendChild(tempEl);
                        const resolvedColor =
                          clonedDoc.defaultView?.getComputedStyle(tempEl)
                            .color || fallback;
                        clonedDoc.body?.removeChild(tempEl);

                        // Check if resolved color contains modern functions
                        for (const modernFunc of modernColorFunctions) {
                          if (resolvedColor.includes(modernFunc)) {
                            return fallback;
                          }
                        }
                        return resolvedColor;
                      } catch {
                        return fallback;
                      }
                    }

                    return colorValue;
                  };

                  // Convert color properties
                  if (computedStyle.color) {
                    htmlEl.style.color = convertModernColor(
                      computedStyle.color,
                      "rgb(0, 0, 0)",
                    );
                  }
                  if (computedStyle.backgroundColor) {
                    htmlEl.style.backgroundColor = convertModernColor(
                      computedStyle.backgroundColor,
                      "rgb(255, 255, 255)",
                    );
                  }
                  if (computedStyle.borderColor) {
                    htmlEl.style.borderColor = convertModernColor(
                      computedStyle.borderColor,
                      "rgb(0, 0, 0)",
                    );
                  }
                  if (computedStyle.borderTopColor) {
                    htmlEl.style.borderTopColor = convertModernColor(
                      computedStyle.borderTopColor,
                      "rgb(0, 0, 0)",
                    );
                  }
                  if (computedStyle.borderRightColor) {
                    htmlEl.style.borderRightColor = convertModernColor(
                      computedStyle.borderRightColor,
                      "rgb(0, 0, 0)",
                    );
                  }
                  if (computedStyle.borderBottomColor) {
                    htmlEl.style.borderBottomColor = convertModernColor(
                      computedStyle.borderBottomColor,
                      "rgb(0, 0, 0)",
                    );
                  }
                  if (computedStyle.borderLeftColor) {
                    htmlEl.style.borderLeftColor = convertModernColor(
                      computedStyle.borderLeftColor,
                      "rgb(0, 0, 0)",
                    );
                  }
                  if (computedStyle.outlineColor) {
                    htmlEl.style.outlineColor = convertModernColor(
                      computedStyle.outlineColor,
                      "rgb(0, 0, 0)",
                    );
                  }
                  if (computedStyle.textDecorationColor) {
                    htmlEl.style.textDecorationColor = convertModernColor(
                      computedStyle.textDecorationColor,
                      "rgb(0, 0, 0)",
                    );
                  }
                }
              } catch (error) {
                console.warn("Error processing element colors:", error);
                // Fallback to basic colors if anything goes wrong
                htmlEl.style.color = "rgb(0, 0, 0)";
                htmlEl.style.backgroundColor = "transparent";
                htmlEl.style.borderColor = "rgb(0, 0, 0)";
              }
            }
          });
        } catch (error) {
          console.warn("Error in onclone callback:", error);
          // Continue without custom styling if there's an error
        }
      },
    });

    console.log(
      `Canvas created successfully: ${canvas.width}x${canvas.height}`,
    );

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error("Failed to create canvas - invalid dimensions");
    }

    // Calculate dimensions - preserve original aspect ratio
    const imgWidth = 190; // A4 width minus margins (210 - 20)
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    console.log("Creating PDF document...");

    // Create PDF
    const pdf = new jsPDF("p", "mm", "a4");

    // Add header with better typography
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.text(title, 105, 20, { align: "center" });

    if (subtitle) {
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "normal");
      pdf.text(subtitle, 105, 28, { align: "center" });
    }

    // Add a subtle line under header
    pdf.setLineWidth(0.5);
    pdf.line(20, 35, 190, 35);

    // Add timestamp with better formatting
    const timestamp = new Date().toLocaleString();
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Generated on: ${timestamp}`, 105, 42, { align: "center" });

    console.log("Converting canvas to image data...");

    // Add content - convert canvas to image data
    const imgData = canvas.toDataURL("image/png", 0.95); // Added quality parameter

    if (!imgData || imgData === "data:,") {
      throw new Error("Failed to convert canvas to image data");
    }

    let heightLeft = imgHeight;
    let position = 55; // Start below improved header with more spacing

    console.log("Adding content to PDF with proper page breaks...");

    // Calculate maximum content height per page (accounting for header and footer)
    const maxContentHeight = pageHeight - position - 25; // 25mm for footer space
    const xMargin = 10; // 10mm left margin

    // Convert canvas to multiple page images if needed
    if (imgHeight > maxContentHeight) {
      console.log(`Content height ${imgHeight}mm exceeds page limit ${maxContentHeight}mm - creating multiple pages`);

      // Create pages by slicing the canvas
      let remainingHeight = imgHeight;
      let canvasYOffset = 0;
      let pageNumber = 0;

      while (remainingHeight > 0) {
        if (pageNumber > 0) {
          pdf.addPage();

          // Add header to continuation pages
          pdf.setFontSize(16);
          pdf.setFont("helvetica", "bold");
          pdf.text(`${title} (continued)`, 105, 20, { align: "center" });

          if (subtitle) {
            pdf.setFontSize(12);
            pdf.setFont("helvetica", "normal");
            pdf.text(subtitle, 105, 28, { align: "center" });
          }

          // Add line under header
          pdf.setLineWidth(0.3);
          pdf.line(20, 35, 190, 35);
        }

        // Calculate content height for this page (first page has larger header)
        const thisPageMaxHeight = pageNumber === 0 ? maxContentHeight : (pageHeight - 45 - 25); // 45mm for continuation header, 25mm for footer
        const pageContentHeight = Math.min(remainingHeight, thisPageMaxHeight);

        // Calculate the portion of the canvas to use for this page
        const canvasSliceHeight = (pageContentHeight / imgHeight) * canvas.height;

        // Create a new canvas with just the slice we need for this page
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        if (tempCtx) {
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvasSliceHeight;

          // Draw the slice from the original canvas
          tempCtx.drawImage(
            canvas,
            0, canvasYOffset,           // Source x, y
            canvas.width, canvasSliceHeight,  // Source width, height
            0, 0,                       // Destination x, y
            canvas.width, canvasSliceHeight   // Destination width, height
          );

          // Convert this slice to image data
          const sliceImageData = tempCanvas.toDataURL("image/png", 0.95);

          // Add the slice to the PDF page
          const yPos = pageNumber === 0 ? position : 45; // First page uses original position, continuation pages start after their header
          pdf.addImage(sliceImageData, "PNG", xMargin, yPos, imgWidth, pageContentHeight);

          // Clean up
          tempCanvas.remove();
        }

        remainingHeight -= pageContentHeight;
        canvasYOffset += canvasSliceHeight;
        pageNumber++;
      }
    } else {
      // Content fits on one page - maintain original layout
      pdf.addImage(imgData, "PNG", xMargin, position, imgWidth, imgHeight);
    }

    // Add footer with better styling
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);

      // Add subtle line above footer
      pdf.setLineWidth(0.3);
      pdf.line(20, 283, 190, 283);

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text("Helio-Hoof Show Jumping Analyzer", 105, 289, {
        align: "center",
      });
      pdf.setFontSize(8);
      pdf.text(`Page ${i} of ${pageCount}`, 190, 289, { align: "right" });
    }

    console.log("Saving PDF...");

    // Download the PDF
    const finalFilename = `${filename}-${new Date().toISOString().split("T")[0]}.pdf`;
    pdf.save(finalFilename);

    console.log(`PDF saved successfully as: ${finalFilename}`);

    // Clean up temporary styles and restore original DOM state
    console.log("Cleaning up temporary PDF export styles...");
    if (tempStyleSheet) {
      tempStyleSheet.remove();
      tempStyleSheet = null;
    }

    // Restore original inline styles
    if (originalStyles) {
      originalStyles?.forEach((styleText, el) => {
        (el as HTMLElement).style.cssText = styleText;
      });
      originalStyles = null;
    }
  } catch (error) {
    console.error("Detailed PDF generation error:", error);

    // Clean up temporary styles even on error
    if (tempStyleSheet) {
      tempStyleSheet.remove();
      tempStyleSheet = null;
    }

    // Restore original inline styles even on error
    if (originalStyles) {
      originalStyles?.forEach((styleText, el) => {
        try {
          (el as HTMLElement).style.cssText = styleText;
        } catch (_e) {
          // Ignore cleanup errors
        }
      });
      originalStyles = null;
    }

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        throw new Error(
          "PDF generation failed: Content element not found. Please refresh the page and try again.",
        );
      } else if (error.message.includes("dimensions")) {
        throw new Error(
          "PDF generation failed: Invalid content dimensions. Please ensure the content is fully loaded.",
        );
      } else if (error.message.includes("canvas")) {
        throw new Error(
          "PDF generation failed: Unable to capture content. This may be due to images still loading or browser compatibility issues.",
        );
      } else {
        throw new Error(`PDF generation failed: ${error.message}`);
      }
    } else {
      throw new Error(
        "PDF generation failed due to an unexpected error. Please try again.",
      );
    }
  }
}

// Helper function to prepare element for PDF export
export function prepareElementForPDF(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Store original styles to restore later
  const originalStyles = new Map<Element, string>();

  // Function to convert modern CSS colors to RGB
  const convertToRGB = (color: string): string => {
    // List of modern color functions to detect
    const modernColorFunctions = [
      "lab(",
      "lch(",
      "oklch(",
      "color-mix(",
      "color(",
    ];

    // Check if the color contains modern color functions
    for (const modernFunc of modernColorFunctions) {
      if (color.includes(modernFunc)) {
        // Return a safe RGB fallback for modern colors
        if (color.includes("lab(")) return "rgb(0, 0, 0)"; // Default to black for text
        return "rgb(255, 255, 255)"; // Default to white for backgrounds
      }
    }

    try {
      // Create a temporary element to compute the color
      const temp = document.createElement("div");
      temp.style.color = color;
      document.body.appendChild(temp);
      const computedColor = getComputedStyle(temp).color;
      document.body.removeChild(temp);

      // Double-check the computed color doesn't contain modern functions
      for (const modernFunc of modernColorFunctions) {
        if (computedColor.includes(modernFunc)) {
          return color.includes("background")
            ? "rgb(255, 255, 255)"
            : "rgb(0, 0, 0)";
        }
      }

      return computedColor;
    } catch (error) {
      console.warn("Error converting color:", color, error);
      // Safe fallback
      return color.includes("background")
        ? "rgb(255, 255, 255)"
        : "rgb(0, 0, 0)";
    }
  };

  // Function to recursively fix colors in elements
  const fixColorsRecursively = (el: Element) => {
    // Store original style
    if (originalStyles) {
      originalStyles.set(el, (el as HTMLElement).style.cssText);
    }

    const computedStyle = getComputedStyle(el);
    const htmlEl = el as HTMLElement;

    // Fix background colors
    if (
      computedStyle.backgroundColor &&
      computedStyle.backgroundColor !== "rgba(0, 0, 0, 0)"
    ) {
      try {
        htmlEl.style.backgroundColor = convertToRGB(
          computedStyle.backgroundColor,
        );
      } catch (_e) {
        htmlEl.style.backgroundColor = "white";
      }
    }

    // Fix text colors
    if (computedStyle.color) {
      try {
        htmlEl.style.color = convertToRGB(computedStyle.color);
      } catch (_e) {
        htmlEl.style.color = "black";
      }
    }

    // Fix border colors
    if (
      computedStyle.borderColor &&
      computedStyle.borderColor !== "rgba(0, 0, 0, 0)"
    ) {
      try {
        htmlEl.style.borderColor = convertToRGB(computedStyle.borderColor);
      } catch (_e) {
        htmlEl.style.borderColor = "black";
      }
    }

    // Process child elements
    Array.from(el.children).forEach((child) => {
      fixColorsRecursively(child);
    });
  };

  // Apply fixes to the main element and all children
  fixColorsRecursively(element);

  // Store the original styles map on the element for later restoration
  (
    element as HTMLElement & { _originalStyles?: Map<Element, string> }
  )._originalStyles = originalStyles;

  // Ensure images are loaded
  const images = element.getElementsByTagName("img");
  Array.from(images).forEach((img) => {
    if (!img.complete) {
      img.style.display = "none";
    }
  });
}

// Helper function to restore element after PDF export
export function restoreElementAfterPDF(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Restore original styles if they were stored
  const originalStyles = (
    element as HTMLElement & { _originalStyles?: Map<Element, string> }
  )._originalStyles;
  if (originalStyles) {
    originalStyles.forEach((styleText, el) => {
      (el as HTMLElement).style.cssText = styleText;
    });
    // Clean up the stored reference
    delete (element as HTMLElement & { _originalStyles?: Map<Element, string> })
      ._originalStyles;
  } else {
    // Fallback: remove temporary styles
    element.style.backgroundColor = "";
    element.style.color = "";
  }

  // Restore images
  const images = element.getElementsByTagName("img");
  Array.from(images).forEach((img) => {
    img.style.display = "";
  });
}
