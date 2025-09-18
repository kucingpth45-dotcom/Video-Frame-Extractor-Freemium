
import React, { useCallback, useRef } from 'react';

interface UploadSectionProps {
  onVideoUpload: (file: File) => void;
  disabled: boolean;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onVideoUpload, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onVideoUpload(file);
    }
  };
  
  const handleBoxClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4 text-center">1. Upload Your Video</h2>
      <div
        onClick={handleBoxClick}
        className={`group relative border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer transition-all duration-300 hover:border-purple-500 hover:bg-gray-800/60 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="video/mp4,video/webm"
          className="hidden"
          disabled={disabled}
        />
        <div className="flex flex-col items-center justify-center">
            <svg className="w-12 h-12 text-gray-500 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            <p className="mt-4 text-lg text-gray-400">
              Click to browse or drag & drop a video file
            </p>
            <p className="text-sm text-gray-500">MP4 or WebM supported. Keep it short for faster processing.</p>
        </div>
      </div>
    </section>
  );
};

export default UploadSection;
