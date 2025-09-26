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
  prompt = `You are an expert equestrian judge and trainer specializing in show jumping analysis. First, examine this image to determine if it contains show jumping content.

STEP 1: Image Validation
CRITICAL: You must be strict about validation. Only analyze images that show:
- A horse and rider actively jumping over a fence, obstacle, or jump
- The horse's feet should be off the ground (in the jumping phase)
- There must be a visible fence/obstacle being cleared

REJECT these types of images:
- Horses and riders on flat ground (not jumping)
- Dressage or flatwork (no jumping)
- Horses standing still or walking
- Screenshots, documents, or non-equestrian content
- Any image without active show jumping

STEP 2: Analysis
If this IS a show jumping image (horse and rider actively clearing an obstacle), analyze and provide technical feedback:

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

FOR SHOW JUMPING IMAGES:
{
  "is_show_jumping": true,
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

FOR NON-SHOW JUMPING IMAGES:
{
  "is_show_jumping": false,
  "content_type": "description of what the image actually shows",
  "message": "This image does not appear to show show jumping content. The Helio-Hoof analyzer is specifically designed for equestrian show jumping analysis. Please upload an image that shows a horse and rider jumping over a fence or obstacle for technical analysis."
}

Be specific, constructive, and use proper equestrian terminology when analyzing show jumping content.`,
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
    console.log("Anthropic analysis from actual server");
    console.log("Analysis preview:", analysis.substring(0, 200) + (analysis.length > 200 ? "..." : ""));

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

    const prompt = `You are an expert equestrian judge and trainer specializing in show jumping analysis. First, examine these ${images.length} images to determine if they contain show jumping content.

STEP 1: Image Validation
CRITICAL: You must be strict about validation. For each image, check if it shows:
- A horse and rider actively jumping over a fence, obstacle, or jump
- The horse's feet should be off the ground (in the jumping phase)
- There must be a visible fence/obstacle being cleared

REJECT these types of images:
- Horses and riders on flat ground (not jumping)
- Dressage or flatwork (no jumping)
- Horses standing still or walking
- Screenshots, documents, or non-equestrian content
- Any image without active show jumping

Count how many images actually show active show jumping vs other content.

STEP 2: Analysis
If ALL images show show jumping, provide comparative technical feedback.
If SOME images show show jumping, analyze only the valid ones and clearly identify which are not suitable.
If NO images show show jumping, explain what the images actually contain and why they cannot be analyzed.

For SHOW JUMPING IMAGES, evaluate:
- Position and balance over the fence
- Leg security and contact
- Hand position and release
- Upper body angle and timing
- Eye focus and overall presentation
- Horse jumping technique and form
- Front leg tucking and evenness
- Bascule (back rounding)
- Scope and effort over the fence

Provide your response in this exact JSON format:

FOR ALL SHOW JUMPING IMAGES:
{
  "all_show_jumping": true,
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

FOR MIXED OR NO SHOW JUMPING IMAGES:
{
  "all_show_jumping": false,
  "show_jumping_count": [number of images that actually show show jumping],
  "valid_images": [array of image numbers that show show jumping],
  "invalid_images": [array of image numbers that don't show show jumping],
  "message": "Some of the uploaded images do not show show jumping content. The Helio-Hoof analyzer is specifically designed for equestrian show jumping analysis. Only images showing horses and riders jumping over fences or obstacles can be analyzed.",
  "individual_analyses": [analysis only for valid show jumping images if any exist]
}

Be specific, constructive, and use proper equestrian terminology when analyzing show jumping content.`;

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
