
import React from 'react';

interface GalleryProps {
  title: string;
  frames: string[];
  selectedFrames?: Set<number>;
  onFrameSelect?: (index: number) => void;
  onFramePreview?: (src: string) => void;
  aspectRatio?: number | null;
  onSelectAll?: () => void;
  isAllSelected?: boolean;
}

const Gallery: React.FC<GalleryProps> = ({ 
  title, 
  frames, 
  selectedFrames, 
  onFrameSelect, 
  onFramePreview, 
  aspectRatio,
  onSelectAll,
  isAllSelected
}) => {
  const isSelectable = !!onFrameSelect;
  const hasFrames = frames.some(f => f);

  const handlePreviewClick = (e: React.MouseEvent<HTMLButtonElement>, frame: string) => {
    e.stopPropagation(); // Prevent the frame selection from triggering
    onFramePreview?.(frame);
  };

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">{title}</h2>
        {onSelectAll && hasFrames && (
          <button
            onClick={onSelectAll}
            className="px-3 py-1 text-sm font-medium text-purple-300 bg-gray-700/60 rounded-md hover:bg-gray-600/60 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {frames.map((frame, index) => {
          if (!frame) return <div key={index} className="bg-gray-800 rounded-lg" style={{ aspectRatio: aspectRatio ? `${aspectRatio}` : '1' }}></div>; // Render a placeholder for missing regenerated frames
          
          const isSelected = selectedFrames?.has(index);
          
          return (
            <button
              key={index}
              onClick={() => onFrameSelect?.(index)}
              disabled={!isSelectable}
              className={`bg-gray-700 rounded-lg overflow-hidden shadow-md group transform transition-all duration-300 hover:scale-105 hover:shadow-purple-500/30 relative focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500
                ${isSelectable ? 'cursor-pointer' : ''}
                ${isSelected ? 'ring-4 ring-purple-500 ring-offset-2 ring-offset-gray-900 scale-105' : ''}
              `}
              style={{ aspectRatio: aspectRatio ? `${aspectRatio}` : undefined }}
            >
              <img 
                  src={frame} 
                  alt={`Frame ${index + 1}`} 
                  className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true"></div>
              <div className="absolute bottom-0 left-0 bg-black/50 text-white text-xs px-2 py-1 rounded-tr-lg">
                Frame {index + 1}
              </div>
              {onFramePreview && (
                <button
                  onClick={(e) => handlePreviewClick(e, frame)}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 bg-gray-900/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label={`Preview frame ${index + 1}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default Gallery;