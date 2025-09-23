import { type NextRequest, NextResponse } from "next/server";
import { analyzeImage } from "@/lib/anthropic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, mimeType } = body;

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: "Missing required fields: imageBase64 and mimeType" },
        { status: 400 },
      );
    }

    const result = await analyzeImage({
      imageBase64,
      mimeType,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to analyze image" },
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
