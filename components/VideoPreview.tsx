
import React, { useRef, useState, useEffect, useCallback } from 'react';

interface VideoPreviewProps {
  src: string;
  onFrameExtracted: (frameData: string) => void;
  onVideoLoaded: (aspectRatio: number) => void;
  onVideoChange: (file: File) => void;
  disabled: boolean;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ src, onFrameExtracted, onVideoLoaded, onVideoChange, disabled }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      onVideoLoaded(video.videoWidth / video.videoHeight);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [src, onVideoLoaded]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    setCurrentTime(time);
  };

  const handleExtractCurrentFrame = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frameData = canvas.toDataURL('image/jpeg');
    onFrameExtracted(frameData);
  };
  
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds === 0) return '00:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onVideoChange(file);
    }
    // Reset the input value to allow uploading the same file again
    if (event.target) {
      event.target.value = '';
    }
  };
  
  const handleChangeVideoClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);


  return (
    <section>
        <h2 className="text-2xl font-semibold mb-4 text-center">Video Preview & Frame Extraction</h2>
        <div className="bg-black rounded-lg mb-4">
            <video ref={videoRef} src={src} controls className="w-full h-auto max-h-[60vh] rounded-lg"></video>
        </div>
        
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <span className="font-mono text-sm text-gray-400">{formatTime(currentTime)}</span>
                <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    step="0.01"
                    value={currentTime}
                    onChange={handleSliderChange}
                    disabled={disabled || duration === 0}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                    aria-label="Video timeline"
                />
                <span className="font-mono text-sm text-gray-400">{formatTime(duration)}</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="video/mp4,video/webm"
                    className="hidden"
                    disabled={disabled}
                />
                <button
                    onClick={handleExtractCurrentFrame}
                    disabled={disabled || duration === 0}
                    className="w-full sm:w-auto px-6 py-2 font-semibold text-white bg-blue-600 rounded-md shadow-md hover:bg-blue-500 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                    Extract Current Frame
                </button>
                <button
                    disabled={true}
                    title="Auto-extraction is currently disabled."
                    className="w-full sm:w-auto px-6 py-2 font-semibold text-white bg-gray-600 rounded-md shadow-md hover:bg-gray-500 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                    Auto-Extract Unique Frames
                </button>
                 <button
                    onClick={handleChangeVideoClick}
                    disabled={disabled}
                    className="w-full sm:w-auto px-6 py-2 font-semibold text-purple-300 bg-transparent border border-purple-400 rounded-md shadow-sm hover:bg-purple-400/20 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                >
                    Change Video
                </button>
            </div>
        </div>
    </section>
  );
};

export default VideoPreview;
