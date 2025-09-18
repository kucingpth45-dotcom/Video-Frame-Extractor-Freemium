
import React from 'react';
import { ArtStyle } from '../types';

interface ControlsProps {
  selectedStyle: ArtStyle;
  onStyleChange: (style: ArtStyle) => void;
  onRegenerate: () => void;
  disabled: boolean;
  remainingRegens: number;
}

const Controls: React.FC<ControlsProps> = ({ 
    selectedStyle, 
    onStyleChange, 
    onRegenerate, 
    disabled,
    remainingRegens
}) => {
  return (
    <section className="text-center space-y-6">
      <h2 className="text-2xl font-semibold">2. Configure & Regenerate</h2>
      
      <p className="text-gray-400 max-w-md mx-auto">
        Select a style and use Gemini to generate brand new, high-detail images based on your original frames. This process may be slower but produces unique results.
      </p>

      {/* Style and Regenerate Button */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <select
          value={selectedStyle}
          onChange={(e) => onStyleChange(e.target.value as ArtStyle)}
          disabled={disabled}
          className="w-full sm:w-64 bg-gray-700 border border-gray-600 rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        >
          {Object.values(ArtStyle).map((style) => (
            <option key={style} value={style}>
              {style}
            </option>
          ))}
        </select>
        <button
          onClick={onRegenerate}
          disabled={disabled || remainingRegens === 0}
          className="w-full sm:w-auto px-8 py-3 font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-md shadow-lg hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
          Regenerate All Frames
        </button>
      </div>
       <p className="text-sm text-gray-400 -mt-2">
        You have {remainingRegens} frame regeneration{remainingRegens !== 1 ? 's' : ''} left for today.
      </p>
    </section>
  );
};

export default Controls;
