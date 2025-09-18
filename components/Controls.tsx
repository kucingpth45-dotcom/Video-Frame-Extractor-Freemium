import React from 'react';
import { ArtStyle, RegenerationEngine } from '../types';

interface ControlsProps {
  selectedStyle: ArtStyle;
  onStyleChange: (style: ArtStyle) => void;
  selectedEngine: RegenerationEngine;
  onEngineChange: (engine: RegenerationEngine) => void;
  onRegenerate: () => void;
  disabled: boolean;
}

const EngineButton: React.FC<{
  engine: RegenerationEngine;
  description: string;
  isSelected: boolean;
  onClick: () => void;
  disabled: boolean;
}> = ({ engine, description, isSelected, onClick, disabled }) => (
  <div className="relative group">
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 w-full
        ${isSelected ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-300 bg-gray-700 hover:bg-gray-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {engine}
    </button>
    <div className="absolute bottom-full mb-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 shadow-lg text-center">
      {description}
    </div>
  </div>
);


const Controls: React.FC<ControlsProps> = ({ 
    selectedStyle, 
    onStyleChange, 
    selectedEngine, 
    onEngineChange, 
    onRegenerate, 
    disabled 
}) => {
  return (
    <section className="text-center space-y-6">
      <h2 className="text-2xl font-semibold">2. Configure & Regenerate</h2>
      
      {/* Engine Selector */}
      <div>
        <h3 className="text-lg font-medium text-gray-300 mb-3">Regeneration Engine</h3>
        <div className="flex justify-center gap-2 p-1 bg-gray-800 rounded-lg max-w-md mx-auto">
          <EngineButton
            engine={RegenerationEngine.STYLE_TRANSFER}
            description="Fast and preserves the original image layout. Best for applying a consistent style."
            isSelected={selectedEngine === RegenerationEngine.STYLE_TRANSFER}
            onClick={() => onEngineChange(RegenerationEngine.STYLE_TRANSFER)}
            disabled={disabled}
          />
          <EngineButton
            engine={RegenerationEngine.REIMAGINE}
            description="Slower, but creates a brand new, high-detail image. May change composition."
            isSelected={selectedEngine === RegenerationEngine.REIMAGINE}
            onClick={() => onEngineChange(RegenerationEngine.REIMAGINE)}
            disabled={disabled}
          />
        </div>
      </div>
      
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
          disabled={disabled}
          className="w-full sm:w-auto px-8 py-3 font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-md shadow-lg hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
          Regenerate All Frames
        </button>
      </div>
    </section>
  );
};

export default Controls;