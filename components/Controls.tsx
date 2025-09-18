import React from 'react';

const Controls: React.FC = () => {
  return (
    <section className="text-center space-y-6">
      <h2 className="text-2xl font-semibold">2. AI Regeneration (Coming Soon!)</h2>
      
      <p className="text-gray-400 max-w-md mx-auto">
        This feature is currently under development. Soon, you'll be able to regenerate your frames in amazing new artistic styles right here!
      </p>

      {/* Disabled Placeholder Button */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
         <div
          className="w-full sm:w-64 bg-gray-700 border border-gray-600 rounded-md px-4 py-3 text-gray-400 opacity-50 cursor-not-allowed"
        >
            Select a Style...
        </div>
        <button
          disabled={true}
          className="w-full sm:w-auto px-8 py-3 font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-md shadow-lg opacity-50 cursor-not-allowed"
        >
          Regenerate Frames
        </button>
      </div>
       <p className="text-sm text-gray-500 -mt-2">
        Check back for updates!
      </p>
    </section>
  );
};

export default Controls;