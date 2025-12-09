import React, { useRef, useEffect, useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

interface WebcamCaptureProps {
  onCapture: (imageData: string) => void;
  isProcessing: boolean;
  className?: string;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture, isProcessing, className = "max-w-md" }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setHasPermission(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        // Flip horizontally for mirror effect if needed, but usually better to send raw
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg');
        onCapture(imageData);
      }
    }
  };

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-red-500 mb-2">Camera access denied.</p>
        <p className="text-sm text-gray-500">Please allow camera access to use this feature.</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center w-full">
      <div className={`relative overflow-hidden rounded-xl shadow-lg bg-black w-full aspect-video ${className}`}>
         <video 
           ref={videoRef} 
           autoPlay 
           playsInline 
           muted
           className="w-full h-full object-cover transform -scale-x-100" // Mirror effect
         />
         {/* Face scanning overlay animation */}
         {!isProcessing && (
           <div className="absolute inset-0 pointer-events-none opacity-50">
              <div className="w-48 h-48 border-2 border-indigo-400 rounded-lg absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                 <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-indigo-500 -mt-1 -ml-1"></div>
                 <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-indigo-500 -mt-1 -mr-1"></div>
                 <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-indigo-500 -mb-1 -ml-1"></div>
                 <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-indigo-500 -mb-1 -mr-1"></div>
              </div>
           </div>
         )}
         
         <canvas ref={canvasRef} className="hidden" />
      </div>

      <button
        onClick={handleCapture}
        disabled={isProcessing}
        className={`mt-6 px-12 py-5 rounded-full font-bold text-xl text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center space-x-3 ${
          isProcessing 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300'
        }`}
      >
        {isProcessing ? (
          <>
            <RefreshCw className="animate-spin mr-2" size={24} />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <Camera className="mr-2" size={24} />
            <span>Capture Attendance</span>
          </>
        )}
      </button>
    </div>
  );
};

export default WebcamCapture;