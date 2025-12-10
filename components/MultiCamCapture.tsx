import React, { useEffect, useRef, useState } from "react";

interface MultiCamCaptureProps {
  onCapture: (
    frames: { cameraIndex: number; frameIndex: number; dataUrl: string }[]
  ) => void;
  isProcessing: boolean;
}

const MultiCamCapture: React.FC<MultiCamCaptureProps> = ({
  onCapture,
  isProcessing,
}) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDevice, setActiveDevice] = useState<MediaDeviceInfo | null>(null);
  const [hasAnyCamera, setHasAnyCamera] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --------------------------------------------------------------
  // Detect cameras and pick a NON-default one (assumed external)
  // --------------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      try {
        // 1) Get default camera (usually laptop inbuilt)
        const tempStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        const defaultTrack = tempStream.getVideoTracks()[0];
        const defaultSettings = defaultTrack.getSettings();
        const defaultDeviceId =
          (defaultSettings.deviceId as string | undefined) || null;

        // stop temp stream
        tempStream.getTracks().forEach((t) => t.stop());

        // 2) Enumerate all video input devices
        const devs = await navigator.mediaDevices.enumerateDevices();
        const cams = devs.filter((d) => d.kind === "videoinput");
        setDevices(cams);
        setHasAnyCamera(cams.length > 0);

        if (cams.length === 0) {
          setActiveDevice(null);
          return;
        }

        // 3) Prefer any NON-default cam (likely external USB)
        let chosen: MediaDeviceInfo | null = null;
        if (defaultDeviceId) {
          const others = cams.filter((c) => c.deviceId !== defaultDeviceId);
          if (others.length > 0) {
            chosen = others[0];
          } else {
            // only one camera exists (the default one)
            chosen = null; // we will NOT use laptop cam in kiosk
          }
        } else {
          // No default id (rare), just use the last camera (often external)
          chosen = cams[cams.length - 1];
        }

        setActiveDevice(chosen);
      } catch (err) {
        console.error("Camera init error:", err);
        setHasAnyCamera(false);
        setActiveDevice(null);
      }
    };

    init();
  }, []);

  // --------------------------------------------------------------
  // Start stream for the chosen external webcam
  // --------------------------------------------------------------
  useEffect(() => {
    if (!activeDevice) return;

    let currentStream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({
        video: { deviceId: { exact: activeDevice.deviceId } },
      })
      .then((stream) => {
        currentStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.error("Camera stream error:", err));

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [activeDevice]);

  const grabFrame = (): string => {
    const canvas = canvasRef.current!;
    const video = videoRef.current!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg");
  };

  // --------------------------------------------------------------
  // Capture: 2 frames from the single active webcam
  // --------------------------------------------------------------
  const handleCapture = () => {
    if (!activeDevice || !videoRef.current) return;

    const frames: {
      cameraIndex: number;
      frameIndex: number;
      dataUrl: string;
    }[] = [];

    for (let f = 0; f < 2; f++) {
      frames.push({
        cameraIndex: 0,
        frameIndex: f,
        dataUrl: grabFrame(),
      });
    }

    if (frames.length === 0) return;
    onCapture(frames);
  };

  // --------------------------------------------------------------
  // When we have cameras but no external (non-default) camera
  // --------------------------------------------------------------
  if (!activeDevice) {
    return (
      <div className="w-full text-center py-10">
        <div className="bg-red-500/20 text-red-300 border border-red-500/40 p-6 rounded-xl max-w-lg mx-auto">
          <h2 className="text-2xl font-bold mb-2">
            {hasAnyCamera ? "No external webcam selected" : "No webcam detected"}
          </h2>
          {hasAnyCamera ? (
            <p className="text-gray-300">
              Only the default camera was found (usually the laptop&apos;s
              inbuilt camera). This kiosk is configured to skip the default
              camera. Please connect an external USB webcam.
            </p>
          ) : (
            <p className="text-gray-300">
              No camera is available. Please connect an external webcam.
            </p>
          )}
        </div>

        <button
          disabled
          className="mt-6 px-10 py-4 rounded-full bg-gray-700 text-gray-400 text-xl cursor-not-allowed"
        >
          Capture Disabled
        </button>

        {/* 
          NOTE: 2-webcam support is temporarily disabled.
          Previously, we supported multiple cameras & captured 2 frames per cam.
          You can reintroduce that by:
            - Tracking an array of activeDevices instead of one
            - Rendering multiple <video> elements
            - Looping over them in handleCapture
        */}
      </div>
    );
  }

  // --------------------------------------------------------------
  // Normal single webcam UI
  // --------------------------------------------------------------
  const activeLabel =
    activeDevice.label || "Selected external camera";

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative rounded-xl overflow-hidden bg-black shadow w-full max-w-md">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover transform -scale-x-100"
        />
        <div className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
          {activeLabel}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <button
        onClick={handleCapture}
        disabled={isProcessing}
        className="mt-6 px-10 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xl shadow disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        {isProcessing ? "Processing..." : "Capture Attendance"}
      </button>
    </div>
  );
};

export default MultiCamCapture;
