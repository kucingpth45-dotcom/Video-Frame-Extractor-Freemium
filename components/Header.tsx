
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center mb-10">
      <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-3">
        Gemini Frame Regenerator
      </h1>
      <p className="text-lg text-gray-400 max-w-2xl mx-auto">
        Upload a short video to extract its frames, then use Gemini to reimagine them in a new artistic style.
      </p>
    </header>
  );
};

export default Header;
