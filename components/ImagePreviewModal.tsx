import React, { useEffect, useCallback, useState } from 'react';

interface ImagePreviewModalProps {
  items: Array<{ src: string; prompt?: string; translatedPrompt?: string; }>;
  startIndex?: number;
  onClose: () => void;
  isEditable?: boolean;
  onEdit?: (currentSrc: string, prompt: string) => Promise<void>;
  onDescribe?: (currentSrc: string) => Promise<void>;
  onTranslate?: (currentSrc: string) => Promise<void>;
  remainingDescribes: number;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ items, startIndex = 0, onClose, isEditable = false, onEdit, onDescribe, onTranslate, remainingDescribes }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isEditing, setIsEditing] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDescribing, setIsDescribing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copySuccessTranslated, setCopySuccessTranslated] = useState(false);


  useEffect(() => {
    // When the image source changes (e.g., after an edit), reset the editing state.
    setIsEditing(false);
    setPrompt('');
  }, [items[currentIndex]]);

  const goToNext = useCallback(() => {
    if (isEditing || isDescribing || isTranslating) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
  }, [items.length, isEditing, isDescribing, isTranslating]);

  const goToPrev = useCallback(() => {
    if (isEditing || isDescribing || isTranslating) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
  }, [items.length, isEditing, isDescribing, isTranslating]);
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (isEditing) {
        setIsEditing(false);
      } else {
        onClose();
      }
    }
    if (items.length > 1 && !isEditing && !isTranslating) {
        if (event.key === 'ArrowRight') {
          goToNext();
        } else if (event.key === 'ArrowLeft') {
          goToPrev();
        }
    }
  }, [onClose, goToNext, goToPrev, items.length, isEditing, isTranslating]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  const handleSubmitEdit = async () => {
    if (!onEdit || !prompt) return;
    setIsSubmitting(true);
    try {
        await onEdit(items[currentIndex].src, prompt);
        // On success, state is reset by the useEffect that watches items
    } catch (error) {
        console.error("Failed to apply edits.", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDescribeClick = async () => {
    if (!onDescribe) return;
    setIsDescribing(true);
    try {
        await onDescribe(items[currentIndex].src);
    } catch (error) {
        // Error is alerted in App.tsx
    } finally {
        setIsDescribing(false);
    }
  };

  const handleTranslateClick = async () => {
    if (!onTranslate) return;
    setIsTranslating(true);
    try {
        await onTranslate(items[currentIndex].src);
    } catch (error) {
        // Error is alerted in App.tsx
    } finally {
        setIsTranslating(false);
    }
  };

  const handleCopyPrompt = () => {
    const currentPrompt = items[currentIndex]?.prompt;
    if (currentPrompt) {
        navigator.clipboard.writeText(currentPrompt).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    }
  };
  
  const handleCopyTranslatedPrompt = () => {
    const translatedPrompt = items[currentIndex]?.translatedPrompt;
    if (translatedPrompt) {
        navigator.clipboard.writeText(translatedPrompt).then(() => {
            setCopySuccessTranslated(true);
            setTimeout(() => setCopySuccessTranslated(false), 2000);
        });
    }
  };


  if (!items || items.length === 0) {
    return null;
  }

  const currentItem = items[currentIndex];
  const canDescribe = remainingDescribes > 0;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image Preview"
    >
      <div 
        className="relative w-full max-w-6xl h-full max-h-[90vh] bg-gray-900 rounded-lg shadow-2xl flex flex-col md:flex-row overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image Display Panel */}
        <div className="relative flex-grow flex items-center justify-center bg-black/50">
            <img src={currentItem.src} alt={`Full size preview ${currentIndex + 1} of ${items.length}`} className="w-auto h-auto max-w-full max-h-full object-contain" />
            
            {/* Close Button */}
            <button
            onClick={onClose}
            className="absolute top-2 right-2 p-2 bg-gray-800/70 rounded-full text-white hover:bg-red-600 transition-colors z-30"
            aria-label="Close preview"
            >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            </button>

            {/* Bottom controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-20">
                {!isEditing ? (
                    <div className="flex justify-center items-center gap-4 bg-gray-900/60 backdrop-blur-sm rounded-full px-4 py-2 transition-opacity">
                        {isEditable && (
                            <button 
                                onClick={() => setIsEditing(true)} 
                                className="flex items-center gap-2 text-white hover:text-purple-400 transition-colors p-1"
                                aria-label="Edit with prompt"
                            >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                </svg>
                            <span className="hidden sm:inline text-sm font-medium">Edit</span>
                            </button>
                        )}
                        {!isEditable && onDescribe && !currentItem.prompt && (
                            <button 
                                onClick={handleDescribeClick} 
                                disabled={isDescribing || !canDescribe}
                                title={!canDescribe ? "Description limit reached for this session" : "Generate a description for this image"}
                                className="flex items-center gap-2 text-white hover:text-purple-400 transition-colors p-1 disabled:opacity-50 disabled:cursor-wait"
                                aria-label="Generate a description for this image"
                            >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                            <span className="hidden sm:inline text-sm font-medium">{isDescribing ? 'Describing...' : 'Describe'}</span>
                            </button>
                        )}
                        {!isEditable && onTranslate && currentItem.prompt && !currentItem.translatedPrompt && (
                            <button 
                                onClick={handleTranslateClick} 
                                disabled={isTranslating}
                                title="Translate description to Indonesian"
                                className="flex items-center gap-2 text-white hover:text-purple-400 transition-colors p-1 disabled:opacity-50 disabled:cursor-wait"
                                aria-label="Translate description to Indonesian"
                            >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 2a1 1 0 01.894.553L12.5 5h-5l1.606-2.447A1 1 0 0110 2zM3.443 6a1 1 0 01.894-.553L6.5 8h7l2.163-2.553a1 1 0 01.894.553L18 9v1a1 1 0 01-1 1h-1.28l-2.022 5.056A1 1 0 0112.72 17H7.28a1 1 0 01-.978-.944L4.28 11H3a1 1 0 01-1-1V9l1.443-3z" />
                            </svg>
                            <span className="hidden sm:inline text-sm font-medium">{isTranslating ? 'Translating...' : 'Translate'}</span>
                            </button>
                        )}
                        {items.length > 1 && (isEditable || (!isEditable && onDescribe && !currentItem.prompt)) && <div className="w-px h-4 bg-gray-600"></div>}
                        {items.length > 1 && (
                            <div className="text-white text-sm font-mono">
                                {currentIndex + 1} / {items.length}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-gray-800/90 backdrop-blur-md rounded-lg p-3 space-y-2 shadow-lg w-full animate-slide-up">
                        <textarea
                            aria-label="Prompt for image changes"
                            placeholder="e.g., make the sky starry, add a red scarf..."
                            className="w-full bg-gray-900 text-white rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none border-gray-700 border resize-none"
                            rows={2}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={isSubmitting}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsEditing(false)} disabled={isSubmitting} className="px-4 py-1 text-sm font-semibold text-gray-200 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors">Cancel</button>
                            <button onClick={handleSubmitEdit} disabled={!prompt || isSubmitting} className="px-4 py-1 text-sm font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSubmitting ? 'Applying...' : 'Apply Changes'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            {items.length > 1 && !isEditing && (
                <>
                    <button 
                        onClick={goToPrev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-gray-800/70 rounded-full text-white hover:bg-purple-600 transition-all z-20"
                        aria-label="Previous image"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gray-800/70 rounded-full text-white hover:bg-purple-600 transition-all z-20"
                        aria-label="Next image"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </>
            )}
            
            {/* Submission Loader */}
            {(isSubmitting || isDescribing || isTranslating) && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                    <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-white"></div>
                    <p className="mt-4 text-white">
                        {isSubmitting ? 'Applying your edits...' : isDescribing ? 'Generating description...' : 'Translating...'}
                    </p>
                </div>
            )}
        </div>

        {/* Prompt Info Panel */}
        {currentItem.prompt && (
            <div className="w-full md:w-1/3 md:max-w-sm flex-shrink-0 bg-gray-950/80 p-4 sm:p-6 flex flex-col h-full overflow-y-auto">
                <div className="flex-grow">
                    <div>
                        <h3 className="text-lg font-semibold text-purple-300 mb-3 border-b border-gray-700 pb-2">Generation Prompt</h3>
                        <p className="text-gray-300 text-sm whitespace-pre-wrap font-mono break-words leading-relaxed">
                            {currentItem.prompt}
                        </p>
                        <button 
                            onClick={handleCopyPrompt}
                            className="mt-4 w-full flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-700 rounded-md hover:bg-gray-600 transition-colors disabled:bg-green-600"
                            disabled={copySuccess}
                        >
                            {copySuccess ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Copy Prompt
                                </>
                            )}
                        </button>
                    </div>

                    {currentItem.translatedPrompt && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-teal-300 mb-3 border-b border-gray-700 pb-2">Indonesian Translation</h3>
                            <p className="text-gray-300 text-sm whitespace-pre-wrap font-mono break-words leading-relaxed">
                                {currentItem.translatedPrompt}
                            </p>
                            <button 
                                onClick={handleCopyTranslatedPrompt}
                                className="mt-4 w-full flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-700 rounded-md hover:bg-gray-600 transition-colors disabled:bg-green-600"
                                disabled={copySuccessTranslated}
                            >
                                {copySuccessTranslated ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Copy Translation
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ImagePreviewModal;