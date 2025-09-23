import type {
  ImageAnalysisRequest,
  ImageAnalysisResponse,
  MultipleImageData,
} from "./anthropic";

/**
 * Mock Anthropic service for development purposes
 * Provides realistic sample responses without making actual API calls
 */

// Sample single image analysis responses
const SINGLE_IMAGE_RESPONSES = [
  {
    rider_analysis: {
      overall_score: 8,
      positives: [
        "Solid lower leg position",
        "Good release over the fence",
        "Balanced upper body",
      ],
      areas_for_improvement: [
        "Slightly rounded back",
        "Eyes could be more forward",
        "Hands could be quieter",
      ],
      priority_focus: "Straighten upper body and look ahead to the next fence",
    },
    horse_analysis: {
      overall_score: 9,
      positives: [
        "Powerful jump",
        "Even front leg tucking",
        "Excellent bascule",
      ],
      technical_notes: [
        "Strong takeoff",
        "Good scope over the fence",
        "Athletic movement",
      ],
      athletic_assessment:
        "This horse shows excellent jumping ability with natural technique and power. Very promising athletic capability.",
    },
    partnership_notes:
      "Good harmony between rider and horse. The rider allows the horse to jump while maintaining security. The partnership shows trust and communication.",
    safety_observations:
      "Proper helmet and safety equipment visible. Good control throughout the jumping effort. No immediate safety concerns noted.",
  },
  {
    rider_analysis: {
      overall_score: 6,
      positives: ["Secure leg position", "Following the horse's motion"],
      areas_for_improvement: [
        "Catching the horse in the mouth",
        "Upper body ahead of motion",
        "Grip with hands",
      ],
      priority_focus:
        "Work on automatic release and allowing the horse more freedom over the fence",
    },
    horse_analysis: {
      overall_score: 7,
      positives: ["Willing attitude", "Good effort over the fence"],
      technical_notes: [
        "Slightly hollow back",
        "Uneven front legs",
        "Could use more impulsion",
      ],
      athletic_assessment:
        "Honest horse with good jumping attitude. Could benefit from gymnastic exercises to improve technique and strength.",
    },
    partnership_notes:
      "The partnership shows potential but needs refinement. The rider needs to trust the horse more and interfere less with the jumping motion.",
    safety_observations:
      "All safety equipment present. Rider maintains control but could improve balance for better safety margins.",
  },
  {
    rider_analysis: {
      overall_score: 9,
      positives: [
        "Excellent position",
        "Perfect release",
        "Eyes focused ahead",
        "Secure lower leg",
      ],
      areas_for_improvement: [
        "Minimal areas - could maintain even softer hands",
      ],
      priority_focus: "Continue developing the current excellent technique",
    },
    horse_analysis: {
      overall_score: 8,
      positives: [
        "Exceptional form",
        "Perfect bascule",
        "Even front leg folding",
        "Powerful jump",
      ],
      technical_notes: [
        "Excellent takeoff point",
        "Great scope",
        "Athletic ability evident",
      ],
      athletic_assessment:
        "Outstanding jumper with natural talent and excellent training. Shows great potential for higher levels.",
    },
    partnership_notes:
      "Excellent partnership with clear communication and trust. Rider and horse work in harmony, each allowing the other to perform their role optimally.",
    safety_observations:
      "Exemplary safety practices. Perfect control and balance throughout the jumping phase. This combination demonstrates safe, controlled riding.",
  },
];

// Sample multi-image analysis responses
const MULTI_IMAGE_RESPONSES = [
  {
    individual_analyses: [
      {
        image_number: 1,
        rider_score: 8,
        horse_score: 9,
        key_observations:
          "Strong jumping position over a sizeable oxer, excellent horse form",
        rider_strengths: ["Solid lower leg position", "Good release"],
        rider_weaknesses: [
          "Slightly rounded back",
          "Eyes could be more forward",
        ],
        horse_strengths: ["Powerful jump", "Even front leg tucking"],
        improvements: ["Straighten upper body", "Look up and ahead"],
      },
      {
        image_number: 2,
        rider_score: 7,
        horse_score: 8,
        key_observations:
          "Good technique over vertical fence, consistent position",
        rider_strengths: ["Secure leg", "Following motion well"],
        rider_weaknesses: [
          "Hands a bit restrictive",
          "Upper body slightly ahead",
        ],
        horse_strengths: ["Willing attitude", "Good bascule"],
        improvements: ["Allow more freedom with hands", "Stay centered"],
      },
      {
        image_number: 3,
        rider_score: 9,
        horse_score: 9,
        key_observations:
          "Excellent form and partnership over challenging combination",
        rider_strengths: [
          "Perfect position",
          "Excellent release",
          "Great balance",
        ],
        rider_weaknesses: ["Very minimal - maintain current level"],
        horse_strengths: [
          "Outstanding form",
          "Perfect technique",
          "Great scope",
        ],
        improvements: ["Continue current training program"],
      },
    ],
    comparative_analysis: {
      overall_assessment:
        "Strong progression shown across the sequence with excellent partnership development. The combination shows increasing confidence and improved technique from image 1 to 3.",
      consistency_notes:
        "Good consistency in leg position and overall approach. Shows steady improvement in upper body position and release timing.",
      best_performing_image:
        "Image 3 demonstrates the best overall technique with excellent rider position and outstanding horse form over a challenging fence.",
      development_patterns:
        "Clear improvement pattern visible - rider becoming more confident with release, horse showing increasing power and better form through the sequence.",
      priority_focus_areas: [
        "Continue developing automatic release",
        "Maintain forward eye focus",
        "Build on the excellent partnership foundation",
      ],
    },
    partnership_evaluation:
      "Excellent partnership development shown throughout the sequence. The rider and horse demonstrate increasing trust and communication, with the horse responding well to the rider's improved technique.",
    safety_observations:
      "All safety equipment properly worn throughout. Good control maintained in all phases. The progression shows safe, methodical training practices.",
  },
];

/**
 * Mock function to simulate image analysis with realistic delay
 */
export async function mockAnalyzeImage({
  imageBase64: _imageBase64,
  mimeType: _mimeType,
  prompt: _prompt,
}: ImageAnalysisRequest): Promise<ImageAnalysisResponse> {
  console.log("[MOCK] Analyzing single image - Development mode active");

  // Simulate API delay (500-1500ms)
  const delay = Math.random() * 1000 + 500;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Randomly select a response to simulate variety
  const response =
    SINGLE_IMAGE_RESPONSES[
      Math.floor(Math.random() * SINGLE_IMAGE_RESPONSES.length)
    ];

  return {
    analysis: JSON.stringify(response, null, 2),
    success: true,
  };
}

/**
 * Mock function to simulate multiple image analysis with realistic delay
 */
export async function mockAnalyzeMultipleImages(
  images: MultipleImageData[],
): Promise<ImageAnalysisResponse> {
  console.log(
    `[MOCK] Analyzing ${images.length} images - Development mode active`,
  );

  // Simulate longer API delay for multiple images (1000-3000ms)
  const delay = Math.random() * 2000 + 1000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Generate appropriate number of individual analyses
  const baseResponse = MULTI_IMAGE_RESPONSES[0];
  const individualAnalyses = images.map((_, index) => ({
    ...baseResponse.individual_analyses[0],
    image_number: index + 1,
    rider_score: Math.floor(Math.random() * 3) + 7, // 7-9
    horse_score: Math.floor(Math.random() * 3) + 7, // 7-9
    key_observations: `Analysis for image ${index + 1} showing good technical execution`,
  }));

  const mockResponse = {
    ...baseResponse,
    individual_analyses: individualAnalyses,
  };

  return {
    analysis: JSON.stringify(mockResponse, null, 2),
    success: true,
  };
}

/**
 * Check if we should use mock responses based on environment
 */
export function shouldUseMockMode(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.USE_MOCK_LLM === "true"
  );
}
