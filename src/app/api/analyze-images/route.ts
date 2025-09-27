import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { analyzeMultipleImages } from "@/lib/anthropic";
import { db, schema } from "@/lib/db";
import { logDevConfig, validateDevSetup } from "@/lib/dev-config";

export async function POST(request: NextRequest) {
  // Log development configuration
  logDevConfig();

  // Check authentication
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    const { images, name, description } = body;

    // Debug logging to check what data we're receiving from frontend
    console.log("🔍 API analyze-images received:", {
      imagesCount: images?.length || 0,
      name,
      description,
      nameType: typeof name,
      descriptionType: typeof description,
    });

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

    // Save analysis to history
    try {
      const imageMetadata = images.map(
        (
          img: {
            filename?: string;
            size?: number;
            mimeType: string;
            base64: string;
          },
          index: number,
        ) => ({
          id: crypto.randomUUID(),
          filename: img.filename || `image-${index + 1}`,
          size: img.size || 0,
          type: img.mimeType,
          base64Data: img.base64, // Save the base64 data for history reconstruction
        }),
      );

      // Handle name and description more explicitly
      const finalName = name?.trim()
        ? name.trim()
        : `Multi Image Analysis - ${new Date().toLocaleDateString()}`;
      const finalDescription = description?.trim() ? description.trim() : null;

      console.log("🔍 Multi-image database insertion values:", {
        name: name,
        nameType: typeof name,
        finalName,
        description: description,
        descriptionType: typeof description,
        finalDescription,
      });

      await db.insert(schema.analysisHistory).values({
        userId,
        name: finalName,
        description: finalDescription,
        analysisType: "multi",
        analysisResult: result.analysis,
        images: imageMetadata,
        imageCount: images.length,
        metadata: {
          processingTime: Date.now(),
          model: "claude-3-5-sonnet",
        },
      });
    } catch (dbError) {
      console.error("Failed to save analysis history:", dbError);
      // Don't fail the request if history saving fails
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
