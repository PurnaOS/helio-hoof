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
    is_show_jumping: true,
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
    is_show_jumping: true,
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
    is_show_jumping: true,
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
  // Add multiple non-show jumping responses for testing different scenarios
  {
    is_show_jumping: false,
    content_type: "landscape/nature photograph",
    message: "This image does not appear to show show jumping content. The Helio-Hoof analyzer is specifically designed for equestrian show jumping analysis. Please upload an image that shows a horse and rider jumping over a fence or obstacle for technical analysis."
  },
  {
    is_show_jumping: false,
    content_type: "horse and rider on flat ground",
    message: "This image shows a horse and rider, but they are not jumping over an obstacle. The Helio-Hoof analyzer requires images of active show jumping (horse and rider clearing a fence or jump) to provide technical analysis. Please upload an image showing the jumping phase."
  },
  {
    is_show_jumping: false,
    content_type: "dressage or flatwork",
    message: "This appears to be a dressage or flatwork image rather than show jumping. The Helio-Hoof analyzer is specifically designed for show jumping analysis where horse and rider are jumping over fences or obstacles. Please upload a show jumping image for analysis."
  },
  {
    is_show_jumping: false,
    content_type: "screenshot or document",
    message: "This image appears to be a screenshot, document, or other non-equestrian content. The Helio-Hoof analyzer is designed for show jumping analysis. Please upload an image showing a horse and rider jumping over a fence or obstacle."
  },
];

// Sample multi-image analysis responses
const MULTI_IMAGE_RESPONSES = [
  {
    all_show_jumping: true,
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
  // Sample response for mixed content
  {
    all_show_jumping: false,
    show_jumping_count: 1,
    valid_images: [2],
    invalid_images: [1, 3],
    message: "Some of the uploaded images do not show show jumping content. The Helio-Hoof analyzer is specifically designed for equestrian show jumping analysis. Only images showing horses and riders jumping over fences or obstacles can be analyzed.",
    individual_analyses: [
      {
        image_number: 2,
        rider_score: 8,
        horse_score: 8,
        key_observations: "Good technique over vertical fence, rider position shows improvement",
        rider_strengths: ["Secure leg position", "Good release"],
        rider_weaknesses: ["Could improve eye focus", "Upper body slightly ahead"],
        horse_strengths: ["Willing attitude", "Good form"],
        improvements: ["Look ahead to next fence", "Stay centered over horse"],
      }
    ]
  },
  // Sample response for all images being invalid
  {
    all_show_jumping: false,
    show_jumping_count: 0,
    valid_images: [],
    invalid_images: [1, 2, 3],
    message: "None of the uploaded images show show jumping content suitable for analysis. The Helio-Hoof analyzer is specifically designed for equestrian show jumping analysis. Please upload images that show horses and riders actively jumping over fences or obstacles with the horse's feet off the ground during the jumping phase.",
    individual_analyses: []
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

  // 50% chance of show jumping, 50% chance of non-show jumping for testing validation
  const isShowJumping = Math.random() > 0.5;

  let response;
  if (isShowJumping) {
    // Select from show jumping responses (exclude the last 4 non-show jumping ones)
    const showJumpingResponses = SINGLE_IMAGE_RESPONSES.slice(0, -4);
    response = showJumpingResponses[Math.floor(Math.random() * showJumpingResponses.length)];
  } else {
    // Select from one of the 4 non-show jumping validation responses
    const validationResponses = SINGLE_IMAGE_RESPONSES.slice(-4);
    response = validationResponses[Math.floor(Math.random() * validationResponses.length)];
  }

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

  // 30% chance all images are show jumping, 70% chance of mixed/invalid content for better validation testing
  const allShowJumping = Math.random() > 0.7;

  let mockResponse;
  if (allShowJumping) {
    // Use the first response (all show jumping)
    const baseResponse = MULTI_IMAGE_RESPONSES[0];
    const individualAnalyses = images.map((_, index) => ({
      ...baseResponse.individual_analyses[0],
      image_number: index + 1,
      rider_score: Math.floor(Math.random() * 3) + 7, // 7-9
      horse_score: Math.floor(Math.random() * 3) + 7, // 7-9
      key_observations: `Analysis for image ${index + 1} showing good technical execution`,
    }));

    mockResponse = {
      ...baseResponse,
      individual_analyses: individualAnalyses,
    };
  } else {
    // 40% chance that NO images are valid (stricter validation)
    // 60% chance that some images are valid
    const noValidImages = Math.random() < 0.4;
    const validImageCount = noValidImages ? 0 : Math.max(1, Math.floor(images.length * Math.random()));

    if (validImageCount === 0) {
      // Use the "all invalid" response template
      const baseResponse = MULTI_IMAGE_RESPONSES[2]; // The new "all invalid" template
      mockResponse = {
        ...baseResponse,
        invalid_images: Array.from({length: images.length}, (_, i) => i + 1),
      };
    } else {
      // Use the mixed content response, adapting for actual number of images
      const baseResponse = MULTI_IMAGE_RESPONSES[1];
      const validImages = Array.from({length: validImageCount}, (_, i) => i + 1);
      const invalidImages = Array.from({length: images.length - validImageCount}, (_, i) => validImageCount + i + 1);

      mockResponse = {
        ...baseResponse,
        show_jumping_count: validImageCount,
        valid_images: validImages,
        invalid_images: invalidImages,
        individual_analyses: validImages.map((imageNum) => ({
          ...baseResponse.individual_analyses[0],
          image_number: imageNum,
          rider_score: Math.floor(Math.random() * 3) + 7,
          horse_score: Math.floor(Math.random() * 3) + 7,
          key_observations: `Analysis for image ${imageNum} showing show jumping technique`,
        }))
      };
    }
  }

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
