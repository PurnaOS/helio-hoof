import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

// GET - Retrieve user's analysis history
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const history = await db
      .select()
      .from(schema.analysisHistory)
      .where(eq(schema.analysisHistory.userId, userId))
      .orderBy(desc(schema.analysisHistory.createdAt))
      .limit(50); // Limit to last 50 analyses

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Error fetching analysis history:", error);
    return NextResponse.json(
      { error: "Failed to fetch analysis history" },
      { status: 500 }
    );
  }
}

// POST - Save new analysis to history
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { analysisType, analysisResult, images, metadata } = body;

    if (!analysisType || !analysisResult || !images) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newAnalysis = await db
      .insert(schema.analysisHistory)
      .values({
        userId,
        analysisType,
        analysisResult,
        images,
        imageCount: images.length,
        metadata: metadata || {},
      })
      .returning();

    return NextResponse.json({
      success: true,
      analysis: newAnalysis[0]
    });
  } catch (error) {
    console.error("Error saving analysis history:", error);
    return NextResponse.json(
      { error: "Failed to save analysis" },
      { status: 500 }
    );
  }
}