import { type NextRequest, NextResponse } from "next/server";
import { analyzeMultipleImages } from "@/lib/anthropic";
import { logDevConfig, validateDevSetup } from "@/lib/dev-config";

export async function POST(request: NextRequest) {
  // Log development configuration
  logDevConfig();

  // Validate setup
  const validation = validateDevSetup();
  if (!validation.valid) {
    console.error("❌ Configuration Error:", validation.message);
    return NextResponse.json(
      { error: `Configuration Error: ${validation.message}` },
      { status: 500 },
    );
  }
  try {
    const body = await request.json();
    const { images } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "Missing required field: images array" },
        { status: 400 },
      );
    }

    // Validate each image has required fields
    for (const img of images) {
      if (!img.base64 || !img.mimeType) {
        return NextResponse.json(
          { error: "Each image must have base64 and mimeType fields" },
          { status: 400 },
        );
      }
    }

    const result = await analyzeMultipleImages(images);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to analyze images" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      analysis: result.analysis,
      success: true,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
