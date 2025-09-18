
import React, { useState, useCallback, useEffect } from 'react';
import { ArtStyle } from './types';
import { regenerateImage, editImage, setApiKey } from './services/geminiService';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import Controls from './components/Controls';
import Gallery from './components/Gallery';
import Loader from './components/Loader';
import ActionControls from './components/ActionControls';
import RegenActionControls from './components/RegenActionControls';
import ImagePreviewModal from './components/ImagePreviewModal';
import VideoPreview from './components/VideoPreview';
import ApiKeyManager from './components/ApiKeyManager';

declare const JSZip: any;

const DAILY_REGEN_LIMIT = 10;
const API_CALL_DELAY_MS = 1500; // 1.5 second delay between API calls to avoid rate limiting

export default function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [originalFrames, setOriginalFrames] = useState<string[]>([]);
  const [regeneratedFrames, setRegeneratedFrames] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<ArtStyle>(ArtStyle.CARTOON);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressMessage, setProgressMessage] = useState<string>('');
  
  const [remainingRegens, setRemainingRegens] = useState<number>(DAILY_REGEN_LIMIT);

  const [selectedFrames, setSelectedFrames] = useState<Set<number>>(new Set());
  const [selectedRegenFrames, setSelectedRegenFrames] = useState<Set<number>>(new Set());
  const [activeSelection, setActiveSelection] = useState<'original' | 'regenerated' | null>(null);

  const [previewImages, setPreviewImages] = useState<{ srcs: string[]; startIndex: number; isEditable: boolean; } | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const usageData = localStorage.getItem('geminiFrameRegenUsage');
    let currentCount = 0;
    if (usageData) {
        try {
            const { date, count } = JSON.parse(usageData);
            if (date === today) {
                currentCount = count;
            } else {
                // If it's a new day, reset the data
                localStorage.setItem('geminiFrameRegenUsage', JSON.stringify({ date: today, count: 0 }));
            }
        } catch (error) {
            console.error("Failed to parse usage data from localStorage", error);
            localStorage.removeItem('geminiFrameRegenUsage');
        }
    }
    setRemainingRegens(DAILY_REGEN_LIMIT - currentCount);
  }, []);

  const handleChangeApiKey = useCallback(() => {
    const currentKey = localStorage.getItem('gemini_api_key') || '';
    const newKey = window.prompt("Please enter your Gemini API key:", currentKey);
    
    // The prompt returns null if the user cancels.
    if (newKey !== null) {
        setApiKey(newKey);
        alert(newKey ? "API Key updated. Your next request will use the new key." : "API Key cleared. The app will now use the default key if available.");
    }
  }, []);


  const handleVideoUpload = useCallback((newVideoFile: File) => {
    setVideoFile(newVideoFile);
    setOriginalFrames([]);
    setRegeneratedFrames([]);
    setSelectedFrames(new Set());
    setSelectedRegenFrames(new Set());
    setActiveSelection(null);
    setAspectRatio(null);
    
    if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
    }
    
    const newVideoSrc = URL.createObjectURL(newVideoFile);
    setVideoSrc(newVideoSrc);
  }, [videoSrc]);

  const handleManualFrameExtract = useCallback((frameData: string) => {
    setOriginalFrames(prevFrames => {
        // Prevent adding the same frame multiple times
        if (prevFrames.includes(frameData)) {
            return prevFrames;
        }
        return [...prevFrames, frameData];
    });
  }, []);

  const handleFrameSelect = useCallback((index: number) => {
    setSelectedRegenFrames(new Set());
    setActiveSelection('original');
    setSelectedFrames(prevSelected => {
        const newSelected = new Set(prevSelected);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        if (newSelected.size === 0) setActiveSelection(null);
        return newSelected;
    });
  }, []);
  
  const handleRegenFrameSelect = useCallback((index: number) => {
    setSelectedFrames(new Set());
    setActiveSelection('regenerated');
    setSelectedRegenFrames(prevSelected => {
        const newSelected = new Set(prevSelected);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        if (newSelected.size === 0) setActiveSelection(null);
        return newSelected;
    });
  }, []);

  const handleSelectAllOriginal = useCallback(() => {
    setSelectedRegenFrames(new Set());
    if (selectedFrames.size === originalFrames.length) {
      setSelectedFrames(new Set());
      setActiveSelection(null);
    } else {
      setSelectedFrames(new Set(originalFrames.map((_, i) => i)));
      setActiveSelection('original');
    }
  }, [originalFrames.length, selectedFrames.size]);
  
  const handleSelectAllRegenerated = useCallback(() => {
    setSelectedFrames(new Set());
    const validRegenIndices = regeneratedFrames
      .map((frame, index) => (frame ? index : -1))
      .filter(index => index !== -1);
      
    if (selectedRegenFrames.size === validRegenIndices.length) {
      setSelectedRegenFrames(new Set());
      setActiveSelection(null);
    } else {
      setSelectedRegenFrames(new Set(validRegenIndices));
      setActiveSelection('regenerated');
    }
  }, [regeneratedFrames, selectedRegenFrames.size]);


  const handleDeleteSelected = useCallback(() => {
    if (selectedFrames.size === 0) return;

    const newOriginals = originalFrames.filter((_, i) => !selectedFrames.has(i));
    const newRegenerated = regeneratedFrames.length > 0
        ? regeneratedFrames.filter((_, i) => !selectedFrames.has(i))
        : [];
    
    setOriginalFrames(newOriginals);
    setRegeneratedFrames(newRegenerated);
    setSelectedFrames(new Set());
    setActiveSelection(null);
  }, [originalFrames, regeneratedFrames, selectedFrames]);

  const handleDeleteRegenerated = useCallback(() => {
    if (selectedRegenFrames.size === 0) return;
    const newRegenerated = [...regeneratedFrames];
    for (const index of selectedRegenFrames) {
      newRegenerated[index] = ''; // Clear the frame
    }
    setRegeneratedFrames(newRegenerated);
    setSelectedRegenFrames(new Set());
    setActiveSelection(null);
  }, [regeneratedFrames, selectedRegenFrames]);


  const handleRegenerate = useCallback(async (indicesToProcess?: number[]) => {
    if (originalFrames.length === 0 || !aspectRatio) {
      alert('Please upload a video and extract frames first.');
      return;
    }
    
    // Determine which frames to process. If no specific indices are provided (e.g., "Regenerate All"),
    // process all original frames. Otherwise, process only the specified indices.
    // This allows the function to handle regenerating all frames, selected original frames, 
    // or selected regenerated frames with a single logic path.
    const indices = indicesToProcess ?? originalFrames.map((_, i) => i);
    if (indices.length === 0) return;

    // --- Daily Limit Check ---
    const today = new Date().toISOString().split('T')[0];
    const usageData = localStorage.getItem('geminiFrameRegenUsage');
    let currentCount = 0;
    if (usageData) {
        try {
            const { date, count } = JSON.parse(usageData);
            if (date === today) {
                currentCount = count;
            }
        } catch { /* ignore parsing errors */ }
    }
    
    if (currentCount + indices.length > DAILY_REGEN_LIMIT) {
        const remaining = DAILY_REGEN_LIMIT - currentCount;
        alert(`You have ${remaining} regeneration${remaining !== 1 ? 's' : ''} left today. You are trying to regenerate ${indices.length} frames. Please select fewer frames or try again tomorrow.`);
        return;
    }

    const newCount = currentCount + indices.length;
    localStorage.setItem('geminiFrameRegenUsage', JSON.stringify({ date: today, count: newCount }));
    setRemainingRegens(DAILY_REGEN_LIMIT - newCount);
    // --- End Daily Limit Check ---

    setIsLoading(true);

    let newFrames = [...regeneratedFrames];
    if (newFrames.length < originalFrames.length) {
        newFrames.length = originalFrames.length;
        newFrames.fill('', regeneratedFrames.length);
    }

    try {
      for (let i = 0; i < indices.length; i++) {
        const frameIndex = indices[i];
        const progressIndicator = `(${i + 1} of ${indices.length})`;

        setProgressMessage(`Re-imagining frame ${frameIndex + 1} ${progressIndicator} in ${selectedStyle} style...`);
        
        // IMPORTANT: Always use the original frame as the source for regeneration.
        // This ensures that when re-regenerating a frame from the "Regenerated Frames"
        // gallery, we are not using a lower-quality, previously generated image as input.
        // Instead, we use the pristine original and apply the currently selected style.
        const base64Data = originalFrames[frameIndex].split(',')[1];
        
        const newFrameData = await regenerateImage(
            base64Data, 
            selectedStyle,
            aspectRatio
        );

        const newFrameSrc = `data:image/jpeg;base64,${newFrameData}`;
        newFrames[frameIndex] = newFrameSrc;

        setRegeneratedFrames([...newFrames]);

        // Add a delay between API calls to avoid hitting rate limits
        if (i < indices.length - 1) {
          await new Promise(resolve => setTimeout(resolve, API_CALL_DELAY_MS));
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`An error occurred during regeneration. ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setProgressMessage('');
      
      const finalFrames = [...newFrames]; 
      const regeneratedIndices = indicesToProcess ?? originalFrames.map((_, i) => i);
      
      if (regeneratedIndices.length > 0) {
          const regeneratedSrcs = regeneratedIndices
              .map(index => finalFrames[index])
              .filter(src => !!src); 
          
          if (regeneratedSrcs.length > 0) {
              setPreviewImages({ srcs: regeneratedSrcs, startIndex: 0, isEditable: true });
          }
      }

      setSelectedFrames(new Set());
      setSelectedRegenFrames(new Set());
      setActiveSelection(null);
    }
  }, [originalFrames, regeneratedFrames, selectedStyle, aspectRatio]);

  const handleEditImage = async (currentSrc: string, prompt: string) => {
    const imageIndexInRegenFrames = regeneratedFrames.findIndex(frame => frame === currentSrc);
    if (imageIndexInRegenFrames === -1) {
      alert("An error occurred: Could not find the source image to edit.");
      return;
    }

    try {
      const originalBase64 = regeneratedFrames[imageIndexInRegenFrames].split(',')[1];
      const newBase64 = await editImage(originalBase64, prompt);
      const newSrc = `data:image/jpeg;base64,${newBase64}`;
      
      const newRegeneratedFrames = [...regeneratedFrames];
      newRegeneratedFrames[imageIndexInRegenFrames] = newSrc;
      setRegeneratedFrames(newRegeneratedFrames);

      if (previewImages) {
        const newPreviewSrcs = previewImages.srcs.map(src => src === currentSrc ? newSrc : src);
        setPreviewImages({ ...previewImages, srcs: newPreviewSrcs });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to edit image. ${errorMessage}`);
      throw error;
    }
  };

  const handleFramePreview = (src: string, gallery: 'original' | 'regenerated') => {
    const frameList = gallery === 'original' ? originalFrames : regeneratedFrames;
    const validFrames = frameList.filter(f => f);
    const startIndex = validFrames.indexOf(src);
    if (startIndex !== -1) {
      setPreviewImages({ 
        srcs: validFrames, 
        startIndex, 
        isEditable: gallery === 'regenerated' 
      });
    }
  };
  
  const handlePreviewSelected = useCallback(() => {
    if (selectedFrames.size === 0) return;
    const selectedSrcs = Array.from(selectedFrames)
        .sort((a, b) => a - b)
        .map(index => originalFrames[index]);
    setPreviewImages({ srcs: selectedSrcs, startIndex: 0, isEditable: false });
  }, [selectedFrames, originalFrames]);
  
  const handlePreviewSelectedRegenerated = useCallback(() => {
    if (selectedRegenFrames.size === 0) return;
    const selectedSrcs = Array.from(selectedRegenFrames)
        .sort((a, b) => a - b)
        .map(index => regeneratedFrames[index]);
    setPreviewImages({ srcs: selectedSrcs, startIndex: 0, isEditable: true });
  }, [selectedRegenFrames, regeneratedFrames]);
  
  const handleDownloadSelectedOriginal = async () => {
    if (selectedFrames.size === 0) return;

    setIsLoading(true);
    setProgressMessage(`Zipping ${selectedFrames.size} original frames...`);

    try {
        const zip = new JSZip();
        const selectedArray = Array.from(selectedFrames);

        for (let i = 0; i < selectedArray.length; i++) {
            const frameIndex = selectedArray[i];
            const frameData = originalFrames[frameIndex];
            if (frameData) {
                const base64 = frameData.split(',')[1];
                const fileName = `original_frame_${String(frameIndex + 1).padStart(4, '0')}.jpg`;
                zip.file(fileName, base64, { base64: true });
            }
        }

        const content = await zip.generateAsync({ type: "blob" });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "original_frames.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

    } catch (error) {
        console.error("Error creating zip file for original frames:", error);
        alert("Failed to create zip file for download.");
    } finally {
        setIsLoading(false);
        setProgressMessage('');
        setSelectedFrames(new Set());
        setActiveSelection(null);
    }
  };

  const handleDownloadSelectedRegenerated = async () => {
    if (selectedRegenFrames.size === 0) return;

    setIsLoading(true);
    setProgressMessage(`Zipping ${selectedRegenFrames.size} frames...`);

    try {
        const zip = new JSZip();
        const selectedArray = Array.from(selectedRegenFrames);

        for (let i = 0; i < selectedArray.length; i++) {
            const frameIndex = selectedArray[i];
            const frameData = regeneratedFrames[frameIndex];
            if (frameData) {
                const base64 = frameData.split(',')[1];
                const fileName = `regenerated_frame_${String(frameIndex + 1).padStart(4, '0')}.jpg`;
                zip.file(fileName, base64, { base64: true });
            }
        }

        const content = await zip.generateAsync({ type: "blob" });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "regenerated_frames.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

    } catch (error) {
        console.error("Error creating zip file:", error);
        alert("Failed to create zip file for download.");
    } finally {
        setIsLoading(false);
        setProgressMessage('');
        setSelectedRegenFrames(new Set());
        setActiveSelection(null);
    }
  };


  const handleClosePreview = () => {
    setPreviewImages(null);
  };
  
  const validRegenCount = regeneratedFrames.filter(f => f).length;


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans pb-24 relative">
      <ApiKeyManager onChangeApiKey={handleChangeApiKey} />
      {isLoading && <Loader message={progressMessage} />}
      <main className="container mx-auto px-4 py-8">
        <Header />

        <div className="max-w-4xl mx-auto bg-gray-800/50 rounded-2xl shadow-2xl backdrop-blur-sm p-6 md:p-8 space-y-8">
          {!videoSrc ? (
            <UploadSection onVideoUpload={handleVideoUpload} disabled={isLoading} />
          ) : (
            <VideoPreview 
                src={videoSrc}
                onFrameExtracted={handleManualFrameExtract}
                onVideoLoaded={setAspectRatio}
                onVideoChange={handleVideoUpload}
                disabled={isLoading}
            />
          )}

          {originalFrames.length > 0 && (
            <>
              <div className="w-full h-px bg-gray-700"></div>
              <Gallery 
                title="Original Frames" 
                frames={originalFrames} 
                selectedFrames={selectedFrames}
                onFrameSelect={handleFrameSelect}
                onFramePreview={(src) => handleFramePreview(src, 'original')}
                aspectRatio={aspectRatio}
                onSelectAll={handleSelectAllOriginal}
                isAllSelected={originalFrames.length > 0 && selectedFrames.size === originalFrames.length}
              />
              <div className="w-full h-px bg-gray-700"></div>
              <Controls
                selectedStyle={selectedStyle}
                onStyleChange={setSelectedStyle}
                onRegenerate={() => handleRegenerate()}
                disabled={isLoading || activeSelection !== null}
                remainingRegens={remainingRegens}
              />
            </>
          )}

          {validRegenCount > 0 && (
             <Gallery 
                title="Regenerated Frames" 
                frames={regeneratedFrames} 
                selectedFrames={selectedRegenFrames}
                onFrameSelect={handleRegenFrameSelect}
                onFramePreview={(src) => handleFramePreview(src, 'regenerated')}
                aspectRatio={aspectRatio}
                onSelectAll={handleSelectAllRegenerated}
                isAllSelected={validRegenCount > 0 && selectedRegenFrames.size === validRegenCount}
             />
          )}
        </div>
      </main>
      
      {activeSelection === 'original' && selectedFrames.size > 0 && (
        <ActionControls
            selectionCount={selectedFrames.size}
            onDelete={handleDeleteSelected}
            onRegenerate={() => handleRegenerate(Array.from(selectedFrames))}
            onPreviewSelected={handlePreviewSelected}
            onDownload={handleDownloadSelectedOriginal}
            disabled={isLoading}
            remainingRegens={remainingRegens}
        />
      )}
      
      {activeSelection === 'regenerated' && selectedRegenFrames.size > 0 && (
        <RegenActionControls
            selectionCount={selectedRegenFrames.size}
            onDelete={handleDeleteRegenerated}
            onRegenerateAgain={() => handleRegenerate(Array.from(selectedRegenFrames))}
            onPreviewSelected={handlePreviewSelectedRegenerated}
            onDownload={handleDownloadSelectedRegenerated}
            disabled={isLoading}
            remainingRegens={remainingRegens}
        />
      )}
      
      {previewImages && <ImagePreviewModal 
        srcs={previewImages.srcs} 
        startIndex={previewImages.startIndex} 
        onClose={handleClosePreview}
        isEditable={previewImages.isEditable}
        onEdit={handleEditImage}
      />}
    </div>
  );
}
