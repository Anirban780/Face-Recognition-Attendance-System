import React, { useState, useEffect, useMemo } from "react";
import { Upload, CheckCircle, Database, Loader2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { UserRole } from "../types";

export const TrainModelTab: React.FC = () => {
  // ⬇️ NOTE: we no longer use faceDatabase here
  const { users, trainModel } = useApp();

  const students = users.filter((u) => u.role === UserRole.STUDENT);

  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainMessage, setTrainMessage] = useState("");
  const [progress, setProgress] = useState(0);

  // --- simple estimate: ~2 seconds per image
  const estimatedSeconds = useMemo(() => {
    if (selectedFiles.length === 0) return 0;
    const estimatePerImage = 2; // tweak based on your real timing
    return selectedFiles.length * estimatePerImage;
  }, [selectedFiles.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleTrain = async () => {
    if (selectedStudent && selectedFiles.length > 0) {
      setIsTraining(true);
      setProgress(0);
      setTrainMessage("");

      try {
        // selectedStudent is enrollment_no
        await trainModel(selectedStudent, selectedFiles);
        setProgress(100);
        setTrainMessage("Model trained successfully with new images.");
        setSelectedFiles([]);
      } catch (err) {
        console.error(err);
        setTrainMessage("Training failed. Please try again.");
      } finally {
        setIsTraining(false);
        // clear success/failure message after a few seconds
        setTimeout(() => {
          setTrainMessage("");
          setProgress(0);
        }, 3000);
      }
    }
  };

  // --- Fake progress bar that fills up while isTraining is true
  useEffect(() => {
    if (!isTraining || estimatedSeconds === 0) return;

    const totalMs = estimatedSeconds * 1000;
    const stepMs = 250;
    const stepPercent = (stepMs / totalMs) * 100;

    let timer: number | undefined;

    timer = window.setInterval(() => {
      setProgress((prev) => {
        // let it go up to 90% while waiting for real completion
        if (prev >= 90) return 90;
        return Math.min(prev + stepPercent, 90);
      });
    }, stepMs);

    return () => {
      if (timer) {
        window.clearInterval(timer);
      }
    };
  }, [isTraining, estimatedSeconds]);

  // Helper to get face-image count from user object
  // (support both camelCase and snake_case just in case)
  const getImageCountForStudent = (student: any): number => {
    if (typeof student.faceImageCount === "number") {
      return student.faceImageCount;
    }
    if (typeof student.face_image_count === "number") {
      return student.face_image_count;
    }
    return 0;
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* TRAIN SECTION */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 animate-fade-in">
        <div className="flex items-center mb-6">
          <div className="bg-indigo-100 p-2 rounded-lg mr-4">
            <Database className="text-indigo-600" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Train Face Recognition
            </h2>
            <p className="text-sm text-gray-500">
              Upload images for student face data
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Student
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isTraining}
            >
              <option value="">-- Choose Student --</option>
              {students.map((s) => (
                <option key={s.id} value={s.enrollmentNo}>
                  {s.name} ({s.enrollmentNo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Face Images
            </label>
            <div className="flex items-center justify-center w-full">
              <label
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isTraining
                    ? "bg-gray-100 cursor-not-allowed opacity-70"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-gray-400">PNG, JPG (MAX. 5MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isTraining}
                />
              </label>
            </div>
            {selectedFiles.length > 0 && (
              <p className="mt-2 text-sm text-indigo-600 font-medium">
                {selectedFiles.length} file
                {selectedFiles.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          {/* Progress + estimate */}
          {isTraining && (
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>
                  Training on {selectedFiles.length} image
                  {selectedFiles.length > 1 ? "s" : ""}. This may take ~
                  {estimatedSeconds} second
                  {estimatedSeconds !== 1 ? "s" : ""}. Please keep this tab
                  open.
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 bg-indigo-600 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleTrain}
            disabled={
              !selectedStudent || selectedFiles.length === 0 || isTraining
            }
            className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center transition-colors ${
              isTraining ||
              !selectedStudent ||
              selectedFiles.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {isTraining ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Training model...
              </>
            ) : (
              "Start Training"
            )}
          </button>

          {trainMessage && (
            <div
              className={`p-3 rounded-lg flex items-center border text-sm ${
                trainMessage.toLowerCase().includes("failed")
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-green-50 text-green-700 border-green-200"
              }`}
            >
              {!trainMessage.toLowerCase().includes("failed") && (
                <CheckCircle size={18} className="mr-2" />
              )}
              {trainMessage}
            </div>
          )}
        </div>
      </div>

      {/* Training Status Summary */}
      <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Training Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {students.map((student) => {
            const imgCount = getImageCountForStudent(student);
            const isTrained = imgCount > 0;

            return (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={student.avatar}
                    alt={student.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {student.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {student.enrollmentNo}
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    isTrained
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {isTrained ? `${imgCount} Imgs` : "No Data"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
