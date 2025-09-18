
import React, { useEffect, useCallback, useState } from 'react';

interface ImagePreviewModalProps {
  srcs: string[];
  startIndex?: number;
  onClose: () => void;
  isEditable?: boolean;
  onEdit?: (currentSrc: string, prompt: string) => Promise<void>;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ srcs, startIndex = 0, onClose, isEditable = false, onEdit }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isEditing, setIsEditing] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // When the image source changes (e.g., after an edit), reset the editing state.
    setIsEditing(false);
    setPrompt('');
  }, [srcs[currentIndex]]);

  const goToNext = useCallback(() => {
    if (isEditing) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % srcs.length);
  }, [srcs.length, isEditing]);

  const goToPrev = useCallback(() => {
    if (isEditing) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + srcs.length) % srcs.length);
  }, [srcs.length, isEditing]);
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (isEditing) {
        setIsEditing(false);
      } else {
        onClose();
      }
    }
    if (srcs.length > 1 && !isEditing) {
        if (event.key === 'ArrowRight') {
          goToNext();
        } else if (event.key === 'ArrowLeft') {
          goToPrev();
        }
    }
  }, [onClose, goToNext, goToPrev, srcs.length, isEditing]);

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
        await onEdit(srcs[currentIndex], prompt);
        // On success, state is reset by the useEffect that watches srcs
    } catch (error) {
        console.error("Failed to apply edits.", error);
    } finally {
        setIsSubmitting(false);
    }
  };


  if (!srcs || srcs.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image Preview"
    >
      <div 
        className="relative max-w-4xl max-h-[90vh] bg-gray-900 rounded-lg shadow-2xl flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <img src={srcs[currentIndex]} alt={`Full size preview ${currentIndex + 1} of ${srcs.length}`} className="w-auto h-auto max-w-full max-h-[90vh] object-contain" />
        
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

        {/* --- Bottom controls --- */}
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
                    {srcs.length > 1 && isEditable && <div className="w-px h-4 bg-gray-600"></div>}
                    {srcs.length > 1 && (
                        <div className="text-white text-sm font-mono">
                            {currentIndex + 1} / {srcs.length}
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
        {srcs.length > 1 && !isEditing && (
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
        {isSubmitting && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                 <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-white"></div>
                 <p className="mt-4 text-white">Applying your edits...</p>
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
