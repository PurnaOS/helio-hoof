import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";

// GET - Retrieve specific analysis by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const analysis = await db
      .select()
      .from(schema.analysisHistory)
      .where(
        and(
          eq(schema.analysisHistory.id, id),
          eq(schema.analysisHistory.userId, userId)
        )
      )
      .limit(1);

    if (analysis.length === 0) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ analysis: analysis[0] });
  } catch (error) {
    console.error("Error fetching analysis:", error);
    return NextResponse.json(
      { error: "Failed to fetch analysis" },
      { status: 500 }
    );
  }
}

// DELETE - Delete specific analysis
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const result = await db
      .delete(schema.analysisHistory)
      .where(
        and(
          eq(schema.analysisHistory.id, id),
          eq(schema.analysisHistory.userId, userId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting analysis:", error);
    return NextResponse.json(
      { error: "Failed to delete analysis" },
      { status: 500 }
    );
  }
}