import { GoogleGenAI, Modality, Part } from "@google/genai";
import { ArtStyle, RegenerationEngine } from "../types";

// IMPORTANT: Assumes API_KEY is set in the environment variables
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
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
 * Regenerates an image using either Style Transfer or a full Re-imagination with Imagen.
 * @param base64Data The base64 encoded string of the source image.
 * @param style The artistic style to apply.
 * @param engine The regeneration engine to use.
 * @param aspectRatio The original aspect ratio of the video frame.
 * @param styleReferenceBase64 Optional base64 of an image for style consistency (Style Transfer only).
 * @returns A promise that resolves to the base64 encoded string of the new image.
 */
export const regenerateImage = async (
  base64Data: string, 
  style: ArtStyle, 
  engine: RegenerationEngine,
  aspectRatio: number,
  styleReferenceBase64?: string
): Promise<string> => {
  try {
    if (engine === RegenerationEngine.REIMAGINE) {
        // Path 1: Describe the image, then generate a new one with Imagen.
        const description = await describeImage(base64Data);
        const finalPrompt = `A high-detail, cinematic image in the style of '${style}'. The image depicts: ${description}`;
        return await generateImageWithImagen(finalPrompt, aspectRatio);

    } else {
        // Path 2: Use Style Transfer to edit the existing image.
        const prompt = styleReferenceBase64
          ? `Using the second image as a style reference, regenerate the first image in a consistent '${style}' style. Preserve the composition and subjects of the first image.`
          : `Regenerate this image in a ${style} style. Preserve the main subjects, composition, and overall structure of the original image.`;

        const targetImagePart: Part = {
          inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg',
          },
        };

        const parts: Part[] = [targetImagePart];

        if (styleReferenceBase64) {
          parts.push({
            inlineData: { data: styleReferenceBase64, mimeType: 'image/jpeg' }
          });
        }

        parts.push({ text: prompt });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image-preview',
          contents: { parts },
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
            throw new Error(`Style Transfer was blocked. Reason: ${candidate?.finishReason || response.promptFeedback?.blockReason}.`);
        }

        throw new Error('No image was generated in the API response for Style Transfer.');
    }
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
