import { neon } from "@neondatabase/serverless";
import { desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { analysisHistory } from "../src/lib/db/schema";

// Connect to database
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(connectionString);
const db = drizzle(sql);

async function checkRecentAnalyses() {
  try {
    console.log("🔍 Checking the 5 most recent analysis records...\n");

    // Get the 5 most recent records
    const recentRecords = await db
      .select({
        id: analysisHistory.id,
        name: analysisHistory.name,
        description: analysisHistory.description,
        analysisType: analysisHistory.analysisType,
        createdAt: analysisHistory.createdAt,
        userId: analysisHistory.userId,
        imageCount: analysisHistory.imageCount,
      })
      .from(analysisHistory)
      .orderBy(desc(analysisHistory.createdAt))
      .limit(5);

    if (recentRecords.length === 0) {
      console.log("❌ No analysis records found in database");
      return;
    }

    console.log(`📊 Found ${recentRecords.length} recent records:\n`);

    recentRecords.forEach((record, index) => {
      console.log(`${index + 1}. Analysis ID: ${record.id}`);
      console.log(`   📝 Name: ${record.name || "(null)"}`);
      console.log(`   📄 Description: ${record.description || "(null)"}`);
      console.log(`   🎯 Type: ${record.analysisType}`);
      console.log(`   🖼️  Image Count: ${record.imageCount}`);
      console.log(`   👤 User ID: ${record.userId}`);
      console.log(
        `   📅 Created: ${record.createdAt ? new Date(record.createdAt).toLocaleString() : "(unknown)"}`,
      );
      console.log("");
    });

    // Check if any recent records have null names (which would indicate the issue)
    const recordsWithoutNames = recentRecords.filter((r) => !r.name);
    const recordsWithoutDescriptions = recentRecords.filter(
      (r) => !r.description,
    );

    if (recordsWithoutNames.length > 0) {
      console.log(
        `⚠️  WARNING: ${recordsWithoutNames.length} recent records have null names`,
      );
    }

    if (recordsWithoutDescriptions.length > 0) {
      console.log(
        `ℹ️  INFO: ${recordsWithoutDescriptions.length} recent records have null descriptions (this is expected for some cases)`,
      );
    }

    if (recordsWithoutNames.length === 0) {
      console.log(
        "✅ All recent records have names - this suggests the issue may be resolved",
      );
    }
  } catch (error) {
    console.error("❌ Error checking records:", error);
    throw error;
  }
}

// Run the check
checkRecentAnalyses()
  .then(() => {
    console.log("✅ Check completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Check failed:", error);
    process.exit(1);
  });
