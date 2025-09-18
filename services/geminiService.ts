import { GoogleGenAI, Modality, Part } from "@google/genai";
import { ArtStyle } from "../types";

// IMPORTANT: Assumes API_KEY is set in the environment variables
const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  throw new Error("VITE_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });


/**
 * Uses Gemini to generate a textual description of a given image.
 * @param base64Data The base64 encoded string of the source image.
 * @returns A promise that resolves to a detailed description of the image.
 */
async function describeImage(base64Data: string): Promise<string> {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: 'image/jpeg',
                    }
                },
                {
                    text: 'Describe this image in a concise, detailed paragraph for an image generation AI. Focus on the main subject, its actions, the environment, and the overall composition.'
                }
            ]
        }
    });
    return response.text;
}

/**
 * Generates a new image using the Imagen model from a text prompt.
 * @param prompt The detailed text prompt for image generation.
 * @param aspectRatio The desired aspect ratio for the output image.
 * @returns A promise that resolves to the base64 encoded string of the generated image.
 */
async function generateImageWithImagen(prompt: string, aspectRatio: number): Promise<string> {
    // Determine the closest aspect ratio string supported by the Imagen API
    let apiAspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' = '1:1';
    if (aspectRatio) {
        const ratios = {
            '16:9': 16 / 9,
            '9:16': 9 / 16,
            '4:3': 4 / 3,
            '3:4': 3 / 4,
            '1:1': 1,
        };
        
        apiAspectRatio = (Object.keys(ratios) as Array<keyof typeof ratios>).reduce((prev, curr) => 
            Math.abs(ratios[curr] - aspectRatio) < Math.abs(ratios[prev] - aspectRatio) ? curr : prev
        );
    }
    
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: apiAspectRatio,
        },
    });
    
    if (response.generatedImages && response.generatedImages.length > 0) {
        return response.generatedImages[0].image.imageBytes;
    }
    
    throw new Error('Imagen failed to generate an image.');
}

/**
 * Returns a detailed prompt prefix based on the selected art style.
 * @param style The selected ArtStyle.
 * @returns A string to be prepended to the image description.
 */
const getStylePromptPrefix = (style: ArtStyle): string => {
    switch (style) {
        case ArtStyle.REALISTIC:
            return "An ultra-realistic, photorealistic, high-detail photograph. Shot with a professional DSLR camera, sharp focus, intricate details. The image depicts:";
        case ArtStyle.CARTOON:
            return "A vibrant, colorful, bold-lined cartoon illustration in a playful style. Cel-shaded with expressive characters and clean lines. The scene is:";
        case ArtStyle.THREE_D_PIXEL:
            return "A detailed 3D pixel art scene, voxel art, isometric view. Retro gaming aesthetic with a vibrant color palette, blocky and charming. The scene shows:";
        case ArtStyle.ANIME:
            return "A beautiful Japanese anime scene in the style of a critically acclaimed animation studio. Detailed background art, cel-shaded characters, and cinematic anime lighting, depicting:";
        case ArtStyle.VINTAGE_PHOTO:
            return "An authentic-looking vintage sepia photograph from the early 20th century. Grainy texture, faded tones, and soft focus, capturing a timeless moment of:";
        case ArtStyle.CLAYMATION:
            return "A charming claymation stop-motion scene with a handcrafted look. Textured models with visible fingerprints in the clay and whimsical lighting, featuring:";
        case ArtStyle.FANTASY_ART:
            return "An epic digital fantasy art painting. Ethereal lighting, intricate details, and a mythical atmosphere, in the style of a high-fantasy book cover, showing:";
        case ArtStyle.NEON_PUNK:
            return "A neon-drenched, cyberpunk cityscape scene. Glowing neon lights, rainy streets with reflections, high-tech gadgets, and a dystopian 'neon punk' aesthetic. The scene features:";
        default:
            // A sensible fallback
            return `A high-detail, cinematic image in the style of '${style}'. The image depicts:`;
    }
};


/**
 * Regenerates an image by re-imagining it with Imagen.
 * @param base64Data The base64 encoded string of the source image.
 * @param style The artistic style to apply.
 * @param aspectRatio The original aspect ratio of the video frame.
 * @returns A promise that resolves to the base64 encoded string of the new image.
 */
export const regenerateImage = async (
  base64Data: string, 
  style: ArtStyle, 
  aspectRatio: number,
): Promise<string> => {
  try {
    // Describe the image first to get a context-rich prompt.
    const description = await describeImage(base64Data);
    // Get the highly specific style prefix.
    const stylePrefix = getStylePromptPrefix(style);
    // Combine them for a powerful final prompt.
    const finalPrompt = `${stylePrefix} ${description}`;
    
    return await generateImageWithImagen(finalPrompt, aspectRatio);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            throw new Error('The provided Gemini API key is not valid. Please check your key.');
        }
        if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
            throw new Error('API rate limit exceeded. Please wait a moment before trying again or regenerate a smaller selection of frames.');
        }
        if (error.message.includes('blocked')) {
            throw error;
        }
    }
    throw new Error('Failed to regenerate image with Gemini.');
  }
};

/**
 * Edits an image based on a textual prompt using Gemini.
 * @param base64Data The base64 encoded string of the source image.
 * @param prompt The text prompt describing the desired changes.
 * @returns A promise that resolves to the base64 encoded string of the edited image.
 */
export const editImage = async (
  base64Data: string,
  prompt: string,
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/jpeg',
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const candidate = response.candidates?.[0];

    if (candidate && candidate.content && candidate.content.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
    }
    
    if (candidate?.finishReason === 'SAFETY' || candidate?.finishReason === 'RECITATION' || response.promptFeedback?.blockReason) {
        throw new Error(`Image editing was blocked. Reason: ${candidate?.finishReason || response.promptFeedback?.blockReason}. Please modify your prompt and try again.`);
    }

    throw new Error('No image was generated in the API response for editing.');
  } catch (error) {
    console.error("Error calling Gemini API for editing:", error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            throw new Error('The provided Gemini API key is not valid. Please check your key.');
        }
        if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
            throw new Error('API rate limit exceeded. Please wait a moment before trying again.');
        }
        if (error.message.includes('blocked')) {
            throw error;
        }
    }
    throw new Error('Failed to edit image with Gemini.');
  }
};
