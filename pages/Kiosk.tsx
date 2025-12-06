import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, XCircle, CheckCircle, AlertTriangle, Scan } from 'lucide-react';
import { api } from '../services/api';

export const Kiosk: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setPermissionError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreamActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setPermissionError(true);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsStreamActive(false);
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || processing) return;

    setProcessing(true);
    setResult(null);

    // Draw video frame to canvas
    const context = canvasRef.current.getContext('2d');
    if (context) {
      context.drawImage(videoRef.current, 0, 0, 640, 480);
      const imageData = canvasRef.current.toDataURL('image/jpeg');

      try {
        const response = await api.markAttendance(imageData, '101'); 
        
        if (response.success) {
          setResult({ 
            success: true, 
            message: response.student || "Attendance Marked"
          });
          setTimeout(() => setResult(null), 3000);
        } else {
          setResult({ 
            success: false, 
            message: response.message || "Not Recognized"
          });
          setTimeout(() => setResult(null), 3000);
        }
      } catch (error) {
        setResult({ success: false, message: "Connection Error" });
      } finally {
        setProcessing(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Attendance Kiosk</h1>
            <p className="text-slate-400 text-sm">AI Face Recognition System</p>
          </div>
          <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1 rounded-full">
            <div className={`w-2.5 h-2.5 rounded-full ${isStreamActive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="text-xs font-mono uppercase tracking-wider">{isStreamActive ? 'Live Feed' : 'Offline'}</span>
          </div>
        </div>

        <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
          {!isStreamActive && !permissionError && (
            <div className="text-slate-500 flex flex-col items-center">
              <Camera className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">Initializing Camera...</p>
            </div>
          )}

          {permissionError && (
              <div className="text-red-500 flex flex-col items-center bg-white p-8 rounded-xl shadow-lg z-20">
                  <AlertTriangle className="w-12 h-12 mb-2" />
                  <h3 className="text-lg font-bold">Camera Access Denied</h3>
                  <p className="text-sm mb-4">Please allow camera permissions in your browser settings.</p>
                  <button onClick={startCamera} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">Retry</button>
              </div>
          )}
          
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline
            className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-500 ${isStreamActive ? 'opacity-100' : 'opacity-0'}`}
          />
          
          <canvas ref={canvasRef} width="640" height="480" className="hidden" />

          {/* Scanner Animation Effect */}
          {processing && (
              <div className="absolute inset-0 pointer-events-none z-10">
                  <div className="w-full h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)] animate-[scan_1.5s_ease-in-out_infinite]"></div>
              </div>
          )}
          
          {/* Custom Scanner Style */}
          <style>{`
            @keyframes scan {
              0% { top: 0%; opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { top: 100%; opacity: 0; }
            }
          `}</style>

          {/* Face Guide Overlay */}
          {isStreamActive && !processing && !result && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-2 border-dashed border-white/40 rounded-3xl relative">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500 rounded-br-lg"></div>
                </div>
            </div>
          )}

          {/* Result Overlay */}
          {result && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20 transition-all duration-300">
              <div className={`
                text-center p-8 rounded-2xl bg-white shadow-2xl min-w-[320px] transform transition-all scale-100
                ${result.success ? 'border-b-4 border-green-500' : 'border-b-4 border-red-500'}
              `}>
                {result.success ? (
                  <div className="flex flex-col items-center animate-bounce-short">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">Identified</h3>
                    <p className="text-green-700 font-semibold text-lg">{result.message}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <XCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">Failed</h3>
                    <p className="text-gray-600">{result.message}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-8 flex flex-col items-center bg-gray-50 border-t border-gray-200">
          <button
            onClick={handleCapture}
            disabled={processing || !isStreamActive}
            className={`
              w-full max-w-md py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center transition-all transform active:scale-95
              ${processing 
                ? 'bg-slate-700 text-slate-300 cursor-wait' 
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/30 text-white'}
            `}
          >
            {processing ? (
              <>
                <Scan className="w-6 h-6 mr-3 animate-pulse" />
                Scanning Face...
              </>
            ) : (
              <>
                <Camera className="w-6 h-6 mr-3" />
                Capture & Mark Attendance
              </>
            )}
          </button>
          <p className="mt-4 text-xs text-gray-400">
             Ensure good lighting and face the camera directly.
          </p>
        </div>
      </div>
    </div>
  );
};