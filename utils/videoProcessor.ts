
/**
 * Calculates the variance of the Laplacian of an image to detect blur.
 * A low variance suggests a lack of edges and thus a blurry image.
 * @param context The canvas 2D rendering context containing the frame.
 * @param width The width of the canvas.
 * @param height The height of the canvas.
 * @param blurThreshold The sensitivity threshold for blur detection.
 * @returns True if the frame is likely blurry, false otherwise.
 */
const isFrameBlurry = (context: CanvasRenderingContext2D, width: number, height: number, blurThreshold: number): boolean => {
    const imageData = context.getImageData(0, 0, width, height);
    const gray = new Uint8ClampedArray(width * height);
    
    // Convert image to grayscale for simpler analysis
    for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        gray[i / 4] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    let laplacianMean = 0;
    const laplacianValues: number[] = [];

    // Apply a 3x3 Laplacian kernel to find edges
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const center = gray[y * width + x];
            const top = gray[(y - 1) * width + x];
            const bottom = gray[(y + 1) * width + x];
            const left = gray[y * width + (x - 1)];
            const right = gray[y * width + (x + 1)];
            const laplacian = (top + bottom + left + right) - 4 * center;
            laplacianValues.push(laplacian);
            laplacianMean += laplacian;
        }
    }

    if (laplacianValues.length === 0) return false;

    laplacianMean /= laplacianValues.length;

    // Calculate the variance of the Laplacian values
    let variance = 0;
    for (const value of laplacianValues) {
        variance += Math.pow(value - laplacianMean, 2);
    }
    variance /= laplacianValues.length;
    
    return variance < blurThreshold;
};

/**
 * Calculates the Mean Absolute Difference between the current frame and the previous one.
 * This helps filter out frames that are visually very similar (e.g., static scenes).
 * @param currentContext The canvas context with the current frame.
 * @param previousFrameData The ImageData of the last accepted frame.
 * @param width The width of the canvas.
 * @param height The height of the canvas.
 * @param similarityThreshold The sensitivity threshold for similarity.
 * @returns True if the frames are considered similar, false otherwise.
 */
const areFramesSimilar = (
  currentContext: CanvasRenderingContext2D,
  previousFrameData: ImageData | null,
  width: number,
  height: number,
  similarityThreshold: number
): boolean => {
  if (!previousFrameData) {
    return false; // The first frame is always unique.
  }
  
  const currentFrameData = currentContext.getImageData(0, 0, width, height);
  
  // For performance, sample a subset of pixels instead of all of them.
  const sampleRate = 10;
  let diff = 0;
  const numPixels = (width * height);

  for (let i = 0; i < numPixels * 4; i += 4 * sampleRate) {
    diff += Math.abs(currentFrameData.data[i] - previousFrameData.data[i]);       // Red channel
    diff += Math.abs(currentFrameData.data[i+1] - previousFrameData.data[i+1]); // Green channel
    diff += Math.abs(currentFrameData.data[i+2] - previousFrameData.data[i+2]); // Blue channel
  }

  const totalSamples = numPixels / sampleRate;
  const avgDiff = diff / (totalSamples * 3); // Average difference per channel

  return avgDiff < similarityThreshold;
};


/**
 * Extracts distinct, non-blurry frames from a video file.
 * @param videoFile The video file to process.
 * @param framesPerSecond The number of frames to attempt to extract per second.
 * @param maxFrames The maximum number of frames to return.
 * @param onProgress Callback to report progress towards finding `maxFrames`.
 * @param options Object containing thresholds for blur and similarity.
 * @returns A promise that resolves to an object containing an array of base64 encoded frame images and the video's aspect ratio.
 */
export const extractFrames = (
  videoFile: File,
  framesPerSecond: number,
  maxFrames: number,
  onProgress: (progress: { current: number, total: number }) => void,
  options: { blurThreshold: number; similarityThreshold: number }
): Promise<{ frames: string[], aspectRatio: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    
    const frames: string[] = [];
    let lastAcceptedFrameData: ImageData | null = null;

    if (!context) {
      return reject(new Error('Could not get canvas context.'));
    }

    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    video.muted = true;

    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const aspectRatio = video.videoWidth / video.videoHeight;
      
      const duration = video.duration;
      const interval = 1 / framesPerSecond;
      let currentTime = 0;
      let acceptedFrameCount = 0;

      const processFrame = () => {
        if (currentTime > duration || acceptedFrameCount >= maxFrames) {
          URL.revokeObjectURL(videoUrl);
          resolve({ frames, aspectRatio });
          return;
        }
        video.currentTime = currentTime;
      };

      video.addEventListener('seeked', () => {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const isBlurry = isFrameBlurry(context, canvas.width, canvas.height, options.blurThreshold);
        const isSimilar = areFramesSimilar(context, lastAcceptedFrameData, canvas.width, canvas.height, options.similarityThreshold);
        
        if (!isBlurry && !isSimilar) {
          frames.push(canvas.toDataURL('image/jpeg'));
          lastAcceptedFrameData = context.getImageData(0, 0, canvas.width, canvas.height);
          acceptedFrameCount++;
          onProgress({ current: acceptedFrameCount, total: maxFrames });
        }
        
        currentTime += interval;
        processFrame();
      });

      processFrame();
    });

    video.addEventListener('error', (e) => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error(`Video loading error: ${e.message ? e.message : 'Unknown error'}`));
    });

    video.load();
  });
};
