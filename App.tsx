import React, { useState, useCallback, useEffect } from 'react';
import { ArtStyle } from './types';
import { regenerateImage, editImage, describeImage, translateText } from './services/geminiService';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import Controls from './components/Controls';
import Gallery from './components/Gallery';
import Loader from './components/Loader';
import ActionControls from './components/ActionControls';
import RegenActionControls from './components/RegenActionControls';
import ImagePreviewModal from './components/ImagePreviewModal';
import VideoPreview from './components/VideoPreview';

declare const JSZip: any;

const SESSION_DESCRIBE_LIMIT = 5;
const API_CALL_DELAY_MS = 1500; // 1.5 second delay between API calls to avoid rate limiting

interface RegeneratedFrame {
  src: string;
  prompt: string;
}

interface OriginalFrame {
  src: string;
  prompt?: string;
  translatedPrompt?: string;
}

export default function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [originalFrames, setOriginalFrames] = useState<OriginalFrame[]>([]);
  const [regeneratedFrames, setRegeneratedFrames] = useState<Array<RegeneratedFrame | null>>([]);
  const [selectedStyle, setSelectedStyle] = useState<ArtStyle>(ArtStyle.CARTOON);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressMessage, setProgressMessage] = useState<string>('');
  
  const [describeCount, setDescribeCount] = useState<number>(0);

  const [selectedFrames, setSelectedFrames] = useState<Set<number>>(new Set());
  const [selectedRegenFrames, setSelectedRegenFrames] = useState<Set<number>>(new Set());
  const [activeSelection, setActiveSelection] = useState<'original' | 'regenerated' | null>(null);

  const [previewImages, setPreviewImages] = useState<{ items: Array<{ src: string; prompt?: string; translatedPrompt?: string; }>; startIndex: number; isEditable: boolean; } | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);


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
        if (prevFrames.some(f => f.src === frameData)) {
            return prevFrames;
        }
        return [...prevFrames, { src: frameData }];
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
      newRegenerated[index] = null; // Clear the frame object
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
    
    const indices = indicesToProcess ?? originalFrames.map((_, i) => i);
    if (indices.length === 0) return;

    // Temporarily disable functionality by showing an alert.
    alert('The AI Regeneration feature is coming soon!');
    return;

    /*
    setIsLoading(true);

    let newFrames = [...regeneratedFrames];
    if (newFrames.length < originalFrames.length) {
        newFrames.length = originalFrames.length;
        newFrames.fill(null, regeneratedFrames.length);
    }

    try {
      for (let i = 0; i < indices.length; i++) {
        const frameIndex = indices[i];
        const progressIndicator = `(${i + 1} of ${indices.length})`;

        setProgressMessage(`Re-imagining frame ${frameIndex + 1} ${progressIndicator} in ${selectedStyle} style...`);
        
        const base64Data = originalFrames[frameIndex].src.split(',')[1];
        
        const newFrameData = await regenerateImage(
            base64Data, 
            selectedStyle,
            aspectRatio
        );

        const newFrameSrc = `data:image/jpeg;base64,${newFrameData.image}`;
        newFrames[frameIndex] = { src: newFrameSrc, prompt: newFrameData.prompt };

        setRegeneratedFrames([...newFrames]);

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
          const regeneratedItems = regeneratedIndices
              .map(index => finalFrames[index])
              .filter((item): item is RegeneratedFrame => !!item);
          
          if (regeneratedItems.length > 0) {
              setPreviewImages({ items: regeneratedItems, startIndex: 0, isEditable: true });
          }
      }

      setSelectedFrames(new Set());
      setSelectedRegenFrames(new Set());
      setActiveSelection(null);
    }
    */
  }, [originalFrames, regeneratedFrames, selectedStyle, aspectRatio]);

  const handleEditImage = async (currentSrc: string, prompt: string) => {
    const imageIndexInRegenFrames = regeneratedFrames.findIndex(frame => frame?.src === currentSrc);
    if (imageIndexInRegenFrames === -1) {
      alert("An error occurred: Could not find the source image to edit.");
      return;
    }

    try {
      const originalBase64 = regeneratedFrames[imageIndexInRegenFrames]!.src.split(',')[1];
      const { image: newBase64, prompt: newPrompt } = await editImage(originalBase64, prompt);
      const newSrc = `data:image/jpeg;base64,${newBase64}`;
      
      const newRegeneratedFrames = [...regeneratedFrames];
      newRegeneratedFrames[imageIndexInRegenFrames] = { src: newSrc, prompt: newPrompt };
      setRegeneratedFrames(newRegeneratedFrames);

      if (previewImages) {
        const newPreviewItems = previewImages.items.map(item => 
            item.src === currentSrc 
            ? { src: newSrc, prompt: newPrompt } 
            : item
        );
        setPreviewImages({ ...previewImages, items: newPreviewItems });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to edit image. ${errorMessage}`);
      throw error;
    }
  };

  const handleDescribeImage = async (currentSrc: string) => {
    const remainingDescriptions = SESSION_DESCRIBE_LIMIT - describeCount;
    if (remainingDescriptions <= 0) {
      alert("You have reached the description limit of 5 frames for this session.");
      throw new Error("Description limit reached.");
    }
    
    try {
      const base64Data = currentSrc.split(',')[1];
      const description = await describeImage(base64Data);
      const fullPrompt = `Image Description:\n\n${description}`;

      const newOriginalFrames = originalFrames.map(frame => 
        frame.src === currentSrc ? { ...frame, prompt: fullPrompt, translatedPrompt: undefined } : frame
      );
      setOriginalFrames(newOriginalFrames);
      setDescribeCount(prev => prev + 1);
      
      if (previewImages) {
        const newPreviewItems = previewImages.items.map(item =>
          item.src === currentSrc
            ? { ...item, prompt: fullPrompt, translatedPrompt: undefined }
            : item
        );
        setPreviewImages({ ...previewImages, items: newPreviewItems });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to describe image. ${errorMessage}`);
      throw error;
    }
  };

  const handleTranslatePrompt = async (currentSrc: string) => {
    const frameIndex = originalFrames.findIndex(f => f.src === currentSrc);
    if (frameIndex === -1) {
        alert("An error occurred: Could not find the source image to translate its prompt.");
        throw new Error("Source image not found for translation.");
    }
    
    const originalPrompt = originalFrames[frameIndex]?.prompt;
    if (!originalPrompt) {
        alert("Please describe the image first before translating.");
        throw new Error("No prompt to translate.");
    }
    
    try {
        const translation = await translateText(originalPrompt, 'Indonesian');

        const newOriginalFrames = [...originalFrames];
        newOriginalFrames[frameIndex] = { ...newOriginalFrames[frameIndex], translatedPrompt: translation };
        setOriginalFrames(newOriginalFrames);

        if (previewImages) {
            const newPreviewItems = previewImages.items.map(item =>
              item.src === currentSrc
                ? { ...item, translatedPrompt: translation }
                : item
            );
            setPreviewImages({ ...previewImages, items: newPreviewItems });
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        alert(`Failed to translate prompt. ${errorMessage}`);
        throw error;
    }
  };
  
  const handleBatchDescribe = useCallback(async () => {
    if (selectedFrames.size === 0) return;

    const remainingDescriptions = SESSION_DESCRIBE_LIMIT - describeCount;
    if (remainingDescriptions <= 0) {
        alert("You have reached the description limit of 5 frames for this session.");
        return;
    }

    setIsLoading(true);
    
    let indicesToProcess = Array.from(selectedFrames).filter(index => !originalFrames[index].prompt);
    
    if (indicesToProcess.length === 0) {
        setProgressMessage("All selected frames are already described.");
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsLoading(false);
        setProgressMessage('');
        setSelectedFrames(new Set());
        setActiveSelection(null);
        return;
    }

    if (indicesToProcess.length > remainingDescriptions) {
        alert(`You can describe ${remainingDescriptions} more frame(s) this session. Processing the first ${remainingDescriptions} undescribed frame(s).`);
        indicesToProcess = indicesToProcess.slice(0, remainingDescriptions);
    }
    
    let newOriginals = [...originalFrames];
    let descriptionsMade = 0;
    
    try {
        for (let i = 0; i < indicesToProcess.length; i++) {
            const frameIndex = indicesToProcess[i];
            const frame = newOriginals[frameIndex];

            setProgressMessage(`Describing frame ${frameIndex + 1} (${i + 1} of ${indicesToProcess.length})...`);
            
            const base64Data = frame.src.split(',')[1];
            const description = await describeImage(base64Data);
            
            newOriginals[frameIndex] = { ...frame, prompt: `Image Description:\n\n${description}`, translatedPrompt: undefined };
            setOriginalFrames([...newOriginals]);
            descriptionsMade++;

            if (i < indicesToProcess.length - 1) {
                await new Promise(resolve => setTimeout(resolve, API_CALL_DELAY_MS));
            }
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        alert(`An error occurred during description. ${errorMessage}`);
    } finally {
        setDescribeCount(prev => prev + descriptionsMade);
        setIsLoading(false);
        setProgressMessage('');
        setSelectedFrames(new Set());
        setActiveSelection(null);
    }
  }, [originalFrames, selectedFrames, describeCount]);


  const handleFramePreview = (src: string, gallery: 'original' | 'regenerated') => {
    if (gallery === 'original') {
        const validFrames = originalFrames.filter(f => f.src);
        const startIndex = validFrames.findIndex(f => f.src === src);
        if (startIndex !== -1) {
            setPreviewImages({ 
                items: validFrames,
                startIndex, 
                isEditable: false 
            });
        }
    } else { // regenerated
        const validItems = regeneratedFrames.filter((f): f is RegeneratedFrame => !!f);
        const startIndex = validItems.findIndex(item => item.src === src);
        if (startIndex !== -1) {
            setPreviewImages({
                items: validItems,
                startIndex,
                isEditable: true,
            });
        }
    }
  };
  
  const handlePreviewSelected = useCallback(() => {
    if (selectedFrames.size === 0) return;
    const selectedItems = Array.from(selectedFrames)
        .sort((a, b) => a - b)
        .map(index => originalFrames[index]);
    setPreviewImages({ items: selectedItems, startIndex: 0, isEditable: false });
  }, [selectedFrames, originalFrames]);
  
  const handlePreviewSelectedRegenerated = useCallback(() => {
    if (selectedRegenFrames.size === 0) return;
    const selectedItems = Array.from(selectedRegenFrames)
        .sort((a, b) => a - b)
        .map(index => regeneratedFrames[index])
        .filter((item): item is RegeneratedFrame => !!item);

    if (selectedItems.length > 0) {
      setPreviewImages({ items: selectedItems, startIndex: 0, isEditable: true });
    }
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
            const frameData = originalFrames[frameIndex].src;
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
            const frameData = regeneratedFrames[frameIndex]?.src;
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
  const remainingDescribes = SESSION_DESCRIBE_LIMIT - describeCount;


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans pb-24 relative">
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
                frames={originalFrames.map(f => f.src)} 
                selectedFrames={selectedFrames}
                onFrameSelect={handleFrameSelect}
                onFramePreview={(src) => handleFramePreview(src, 'original')}
                aspectRatio={aspectRatio}
                onSelectAll={handleSelectAllOriginal}
                isAllSelected={originalFrames.length > 0 && selectedFrames.size === originalFrames.length}
              />
              <div className="w-full h-px bg-gray-700"></div>
              <Controls />
            </>
          )}

          {validRegenCount > 0 && (
             <Gallery 
                title="Regenerated Frames" 
                frames={regeneratedFrames.map(f => f?.src ?? '')} 
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
            onDescribe={handleBatchDescribe}
            onPreviewSelected={handlePreviewSelected}
            onDownload={handleDownloadSelectedOriginal}
            disabled={isLoading}
            remainingDescribes={remainingDescribes}
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
        />
      )}
      
      {previewImages && <ImagePreviewModal 
        items={previewImages.items} 
        startIndex={previewImages.startIndex} 
        onClose={handleClosePreview}
        isEditable={previewImages.isEditable}
        onEdit={handleEditImage}
        onDescribe={handleDescribeImage}
        onTranslate={handleTranslatePrompt}
        remainingDescribes={remainingDescribes}
      />}
    </div>
  );
}