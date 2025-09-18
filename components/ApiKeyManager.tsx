
import React from 'react';

interface ApiKeyManagerProps {
  onChangeApiKey: () => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onChangeApiKey }) => {
  return (
    <div className="absolute top-4 right-4 z-30">
      <button
        onClick={onChangeApiKey}
        title="Change Gemini API Key"
        aria-label="Change Gemini API Key"
        className="p-2 bg-gray-700/50 rounded-full text-gray-300 hover:bg-gray-600/80 hover:text-white transition-all duration-300 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default ApiKeyManager;
