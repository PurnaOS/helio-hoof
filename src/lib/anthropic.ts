import Anthropic from "@anthropic-ai/sdk";
import {
  mockAnalyzeImage,
  mockAnalyzeMultipleImages,
  shouldUseMockMode,
} from "./mock-anthropic";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ImageAnalysisRequest {
  imageBase64: string;
  mimeType: string;
  prompt?: string;
}

export interface MultipleImageData {
  base64: string;
  mimeType: string;
  filename?: string;
}

export interface ImageAnalysisResponse {
  analysis: string;
  success: boolean;
  error?: string;
}

export async function analyzeImage({
  imageBase64,
  mimeType,
  prompt = `You are an expert equestrian judge and trainer specializing in show jumping analysis. Analyze this show jumping image and provide technical feedback.

For the RIDER, evaluate:
- Position and balance over the fence
- Leg security and contact
- Hand position and release
- Upper body angle and timing
- Eye focus and overall presentation

For the HORSE, evaluate:
- Jumping technique and form
- Front leg tucking and evenness
- Bascule (back rounding)
- Scope and effort over the fence
- Overall athletic ability displayed

Provide your response in this exact JSON format:
{
  "rider_analysis": {
    "overall_score": [1-10],
    "positives": ["specific positive observation 1", "positive 2"],
    "areas_for_improvement": ["specific improvement 1", "improvement 2"],
    "priority_focus": "most important area to work on"
  },
  "horse_analysis": {
    "overall_score": [1-10],
    "positives": ["horse positive 1", "horse positive 2"],
    "technical_notes": ["technical observation 1", "observation 2"],
    "athletic_assessment": "overall athletic evaluation"
  },
  "partnership_notes": "how well rider and horse work together",
  "safety_observations": "any safety concerns or excellent safety practices"
}

Be specific, constructive, and use proper equestrian terminology. Focus on actionable feedback that helps improve performance.`,
}: ImageAnalysisRequest): Promise<ImageAnalysisResponse> {
  // Use mock response in development mode if enabled
  if (shouldUseMockMode()) {
    return mockAnalyzeImage({ imageBase64, mimeType, prompt });
  }

  try {

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as
                  | "image/jpeg"
                  | "image/png"
                  | "image/gif"
                  | "image/webp",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    const analysis =
      message.content[0].type === "text" ? message.content[0].text : "";
    console.log("Anthropic analysis from actual server",);
    return {
      analysis,
      success: true,
    };
  } catch (error) {
    console.error("Error analyzing image:", error);
    return {
      analysis: "",
      success: false,
      error: error instanceof Error ? error.message : "Failed to analyze image",
    };
  }
}

export async function analyzeMultipleImages(
  images: MultipleImageData[],
): Promise<ImageAnalysisResponse> {
  // Use mock response in development mode if enabled
  if (shouldUseMockMode()) {
    return mockAnalyzeMultipleImages(images);
  }

  try {
    const imageContent = images.map((img) => ({
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: img.mimeType as
          | "image/jpeg"
          | "image/png"
          | "image/gif"
          | "image/webp",
        data: img.base64,
      },
    }));

    const prompt = `You are an expert equestrian judge and trainer specializing in show jumping analysis. Analyze these ${images.length} show jumping images and provide comparative technical feedback.

For EACH IMAGE, evaluate:
- Position and balance over the fence
- Leg security and contact
- Hand position and release
- Upper body angle and timing
- Eye focus and overall presentation
- Horse jumping technique and form
- Front leg tucking and evenness
- Bascule (back rounding)
- Scope and effort over the fence

Then provide COMPARATIVE ANALYSIS across all images:
- Compare rider techniques between images
- Identify consistency or variations in performance
- Note any progression or development patterns
- Compare horse athletic abilities and jumping styles
- Assess which combinations show the best partnership

Provide your response in this exact JSON format:
{
  "individual_analyses": [
    {
      "image_number": 1,
      "rider_score": [1-10],
      "horse_score": [1-10],
      "key_observations": "brief summary of this specific image",
      "rider_strengths": ["specific rider strength 1", "rider strength 2"],
      "rider_weaknesses": ["specific rider weakness 1", "rider weakness 2"],
      "horse_strengths": ["horse strength 1", "horse strength 2"],
      "improvements": ["improvement 1", "improvement 2"]
    }
  ],
  "comparative_analysis": {
    "overall_assessment": "summary of performance across all images",
    "consistency_notes": "how consistent is the performance",
    "best_performing_image": "which image shows the best technique and why",
    "development_patterns": "any patterns of improvement or decline",
    "priority_focus_areas": ["area 1", "area 2"]
  },
  "partnership_evaluation": "how well rider and horse work together across the sequence",
  "safety_observations": "any safety concerns or excellent safety practices observed"
}

Be specific, constructive, and use proper equestrian terminology. Focus on actionable feedback.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            ...imageContent,
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    const analysis =
      message.content[0].type === "text" ? message.content[0].text : "";

    return {
      analysis,
      success: true,
    };
  } catch (error) {
    console.error("Error analyzing multiple images:", error);
    return {
      analysis: "",
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to analyze images",
    };
  }
}
