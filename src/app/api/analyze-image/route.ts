import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { analyzeImage } from "@/lib/anthropic";
import { logDevConfig, validateDevSetup } from "@/lib/dev-config";
import { db, schema } from "@/lib/db";

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
    const { imageBase64, mimeType, filename, size, name, description } = body;

    // Debug logging to check what data we're receiving from frontend
    console.log('🔍 API analyze-image received:', {
      hasImageBase64: !!imageBase64,
      mimeType,
      filename,
      size,
      name,
      description,
      nameType: typeof name,
      descriptionType: typeof description,
    });

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

    // Save analysis to history
    try {
      const imageMetadata = {
        id: crypto.randomUUID(),
        filename: filename || "uploaded-image",
        size: size || 0,
        type: mimeType,
        base64Data: imageBase64, // Save the base64 data for history reconstruction
      };

      // Handle name and description more explicitly
      const finalName = (name && name.trim()) ? name.trim() : `Single Image Analysis - ${new Date().toLocaleDateString()}`;
      const finalDescription = (description && description.trim()) ? description.trim() : null;

      console.log('🔍 Database insertion values:', {
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
        analysisType: "single",
        analysisResult: result.analysis,
        images: [imageMetadata],
        imageCount: 1,
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
