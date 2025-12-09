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
	const [cameraCount, setCameraCount] = useState(0);

	const videoRefs = useRef<HTMLVideoElement[]>([]);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	// --------------------------------------------------------------
	// Detect available cameras
	// --------------------------------------------------------------
	useEffect(() => {
		navigator.mediaDevices
			.enumerateDevices()
			.then((devs) => {
				const cams = devs.filter((d) => d.kind === "videoinput");
				setDevices(cams);

				// Limit to max 2 cameras but allow 0 or 1
				setCameraCount(Math.min(2, cams.length));
			})
			.catch((err) => console.error("Camera detection error:", err));
	}, []);

	// --------------------------------------------------------------
	// Start camera streams
	// --------------------------------------------------------------
	useEffect(() => {
		if (cameraCount === 0) return;

		devices.slice(0, cameraCount).forEach((device, i) => {
			navigator.mediaDevices
				.getUserMedia({
					video: { deviceId: { exact: device.deviceId } },
				})
				.then((stream) => {
					if (videoRefs.current[i]) {
						videoRefs.current[i].srcObject = stream;
					}
				})
				.catch((err) => console.error("Camera stream error:", err));
		});
	}, [devices, cameraCount]);

	const grabFrame = (video: HTMLVideoElement): string => {
		const canvas = canvasRef.current!;
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		const ctx = canvas.getContext("2d")!;
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
		return canvas.toDataURL("image/jpeg");
	};

	// --------------------------------------------------------------
	// Handle capture (2 frames per camera)
	// --------------------------------------------------------------
	const handleCapture = () => {
		if (cameraCount === 0) return; // safety

		const frames: {
			cameraIndex: number;
			frameIndex: number;
			dataUrl: string;
		}[] = [];

		for (let cam = 0; cam < cameraCount; cam++) {
			const video = videoRefs.current[cam];
			if (!video) continue;

			// Capture 2 frames
			for (let f = 0; f < 2; f++) {
				frames.push({
					cameraIndex: cam,
					frameIndex: f,
					dataUrl: grabFrame(video),
				});
			}
		}

		if (frames.length === 0) return; // prevents empty payloads
		onCapture(frames);
	};

	// --------------------------------------------------------------
	// When NO camera is connected
	// --------------------------------------------------------------
	if (cameraCount === 0) {
		return (
			<div className="w-full text-center py-10">
				<div className="bg-red-500/20 text-red-300 border border-red-500/40 p-6 rounded-xl max-w-lg mx-auto">
					<h2 className="text-2xl font-bold mb-2">
						No Webcam Detected
					</h2>
					<p className="text-gray-300">
						Please connect at least one camera to continue.
					</p>
				</div>

				<button
					disabled
					className="mt-6 px-10 py-4 rounded-full bg-gray-700 text-gray-400 text-xl cursor-not-allowed"
				>
					Capture Disabled
				</button>
			</div>
		);
	}

	// --------------------------------------------------------------
	// Normal 1–2 webcam display
	// --------------------------------------------------------------
	return (
		<div className="w-full flex flex-col items-center">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
				{Array.from({ length: cameraCount }).map((_, i) => (
					<div
						key={i}
						className="relative rounded-xl overflow-hidden bg-black shadow"
					>
						<video
							ref={(el) => {
								if (el) videoRefs.current[i] = el;
							}}
							autoPlay
							muted
							playsInline
							className="w-full h-full object-cover transform -scale-x-100"
						/>
						<div className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
							Camera {i + 1}
						</div>
					</div>
				))}
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
