import React from 'react';

interface ProcessingControlsProps {
  blurThreshold: number;
  onBlurChange: (value: number) => void;
  similarityThreshold: number;
  onSimilarityChange: (value: number) => void;
  onReExtract: () => void;
  disabled: boolean;
}

const ProcessingControls: React.FC<ProcessingControlsProps> = ({
  blurThreshold,
  onBlurChange,
  similarityThreshold,
  onSimilarityChange,
  onReExtract,
  disabled
}) => {
  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4 text-center">Fine-Tune Frame Selection</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mb-4">
        {/* Blur Threshold Slider */}
        <div>
          <label htmlFor="blur-slider" className="block text-sm font-medium text-gray-300 mb-2">
            Blur Sensitivity <span className="text-gray-400 font-normal">(Higher = more blur allowed)</span>
          </label>
          <div className="flex items-center gap-4">
            <input
              id="blur-slider"
              type="range"
              min="10"
              max="200"
              step="5"
              value={blurThreshold}
              onChange={(e) => onBlurChange(Number(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
            <span className="font-mono text-purple-300 w-12 text-center">{blurThreshold}</span>
          </div>
        </div>
        {/* Similarity Threshold Slider */}
        <div>
          <label htmlFor="similarity-slider" className="block text-sm font-medium text-gray-300 mb-2">
            Frame Uniqueness <span className="text-gray-400 font-normal">(Higher = frames must be more different)</span>
          </label>
          <div className="flex items-center gap-4">
            <input
              id="similarity-slider"
              type="range"
              min="1"
              max="50"
              step="1"
              value={similarityThreshold}
              onChange={(e) => onSimilarityChange(Number(e.target.value))}
              disabled={disabled}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
            <span className="font-mono text-purple-300 w-12 text-center">{similarityThreshold}</span>
          </div>
        </div>
      </div>
      <div className="text-center">
        <button
          onClick={onReExtract}
          disabled={disabled}
          className="px-6 py-2 font-semibold text-white bg-gray-600 rounded-md shadow-md hover:bg-gray-500 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
          Re-Extract Frames
        </button>
      </div>
    </section>
  );
};

export default ProcessingControls;