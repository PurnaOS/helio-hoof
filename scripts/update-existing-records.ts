import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { analysisHistory } from "../src/lib/db/schema";
import { isNull, eq } from "drizzle-orm";

// Connect to database
const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(connectionString);
const db = drizzle(sql);

// Dummy names for different analysis types
const dummyNames = {
  single: [
    "Training Session Analysis",
    "Competition Performance Review",
    "Jumping Form Assessment",
    "Dressage Movement Evaluation",
    "Schooling Session Review",
    "Show Preparation Analysis",
    "Technical Skills Assessment",
    "Partnership Evaluation",
  ],
  multi: [
    "Progressive Training Analysis",
    "Competition Series Review",
    "Multi-Session Comparison",
    "Development Progress Study",
    "Training Evolution Analysis",
    "Performance Consistency Review",
    "Improvement Tracking Study",
    "Comprehensive Skills Assessment",
  ]
};

const dummyDescriptions = [
  "Analyzing rider position and horse movement for improvement opportunities",
  "Evaluating technical skills and partnership harmony during this session",
  "Assessment focused on identifying strengths and areas for development",
  "Review of form, balance, and communication between horse and rider",
  "Detailed analysis of performance with specific improvement recommendations",
  "Comprehensive evaluation of riding technique and horse response",
  "Technical assessment for training progression and skill development",
  "Performance review with focus on safety and effectiveness",
];

async function updateExistingRecords() {
  try {
    console.log("🔍 Finding records without names...");

    // Get all records that don't have names
    const recordsWithoutNames = await db
      .select({
        id: analysisHistory.id,
        analysisType: analysisHistory.analysisType,
        createdAt: analysisHistory.createdAt,
      })
      .from(analysisHistory)
      .where(isNull(analysisHistory.name));

    console.log(`📊 Found ${recordsWithoutNames.length} records without names`);

    if (recordsWithoutNames.length === 0) {
      console.log("✅ All records already have names!");
      return;
    }

    console.log("🔄 Updating records with dummy names...");

    for (let i = 0; i < recordsWithoutNames.length; i++) {
      const record = recordsWithoutNames[i];
      const analysisType = record.analysisType as 'single' | 'multi';

      // Get appropriate dummy names array
      const names = dummyNames[analysisType] || dummyNames.single;

      // Pick a name (rotate through available names)
      const nameIndex = i % names.length;
      const name = names[nameIndex];

      // Pick a description (rotate through available descriptions)
      const descriptionIndex = i % dummyDescriptions.length;
      const description = dummyDescriptions[descriptionIndex];

      // Update the record
      await db
        .update(analysisHistory)
        .set({
          name: name,
          description: description,
        })
        .where(eq(analysisHistory.id, record.id));

      console.log(`✅ Updated record ${i + 1}/${recordsWithoutNames.length}: "${name}"`);
    }

    console.log("🎉 Successfully updated all records with dummy names and descriptions!");

  } catch (error) {
    console.error("❌ Error updating records:", error);
    throw error;
  }
}

// Run the update
updateExistingRecords()
  .then(() => {
    console.log("✅ Update completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Update failed:", error);
    process.exit(1);
  });