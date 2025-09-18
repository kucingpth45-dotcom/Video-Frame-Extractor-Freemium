import React from 'react';

interface ActionControlsProps {
  selectionCount: number;
  onDelete: () => void;
  onRegenerate: () => void;
  onPreviewSelected: () => void;
  onDownload: () => void;
  disabled: boolean;
  remainingRegens: number;
}

const ActionControls: React.FC<ActionControlsProps> = ({ 
    selectionCount, 
    onDelete, 
    onRegenerate, 
    onPreviewSelected,
    onDownload,
    disabled,
    remainingRegens
}) => {
  const canRegenerate = selectionCount <= remainingRegens;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 p-2 sm:p-4 flex justify-center">
      <div className="bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-2xl p-2 sm:p-4 flex items-center justify-center gap-1 sm:gap-2 flex-wrap border border-gray-700">
        <span className="font-semibold text-white px-2 text-sm sm:text-base">
          {selectionCount}
          <span className="hidden sm:inline"> frame(s) selected</span>
        </span>
        <div className="w-px h-6 bg-gray-600"></div>
        <span className="text-sm text-gray-300 px-2" title="Daily regeneration quota">
          {remainingRegens}
          <span className="hidden sm:inline"> left today</span>
        </span>
        <div className="w-px h-6 bg-gray-600 hidden sm:block"></div>
        <button
          onClick={onRegenerate}
          disabled={disabled || !canRegenerate}
          title={!canRegenerate ? `Not enough regenerations left today (${remainingRegens} left).` : 'Regenerate selected frames'}
          className="flex items-center gap-2 px-3 py-2 sm:px-4 font-semibold text-white bg-purple-600 rounded-md shadow-lg hover:bg-purple-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
          <span className="hidden sm:inline">Regenerate</span>
        </button>
        <button
          onClick={onDownload}
          disabled={disabled}
          title="Download selected frames"
          className="flex items-center gap-2 px-3 py-2 sm:px-4 font-semibold text-white bg-green-600 rounded-md shadow-lg hover:bg-green-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="hidden sm:inline">Download</span>
        </button>
        <button
          onClick={onPreviewSelected}
          disabled={disabled}
          title="Preview selected frames"
          className="flex items-center gap-2 px-3 py-2 sm:px-4 font-semibold text-white bg-blue-600 rounded-md shadow-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          <span className="hidden sm:inline">Preview</span>
        </button>
        <button
          onClick={onDelete}
          disabled={disabled}
          title="Delete selected frames"
          className="flex items-center gap-2 px-3 py-2 sm:px-4 font-semibold text-white bg-red-600 rounded-md shadow-lg hover:bg-red-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
          </svg>
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>
    </div>
  );
};

export default ActionControls;