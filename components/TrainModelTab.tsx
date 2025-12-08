import React, { useState } from "react";
import { Upload, CheckCircle, Database } from "lucide-react";
import { useApp } from "../context/AppContext";
import { UserRole } from "../types";

export const TrainModelTab: React.FC = () => {
  const { users, faceDatabase, trainModel } = useApp();

  const students = users.filter((u) => u.role === UserRole.STUDENT);

  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainMessage, setTrainMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleTrain = async () => {
    if (selectedStudent && selectedFiles.length > 0) {
      setIsTraining(true);
      await trainModel(selectedStudent, selectedFiles);
      setIsTraining(false);
      setTrainMessage("Model trained successfully with new images.");
      setSelectedFiles([]);
      setTimeout(() => setTrainMessage(""), 3000);
    }
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
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
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
                />
              </label>
            </div>
            {selectedFiles.length > 0 && (
              <p className="mt-2 text-sm text-indigo-600 font-medium">
                {selectedFiles.length} files selected
              </p>
            )}
          </div>

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
            {isTraining ? "Training Model..." : "Start Training"}
          </button>

          {trainMessage && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg flex items-center border border-green-200">
              <CheckCircle size={18} className="mr-2" />
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
            const data = faceDatabase.find(
              (d) => d.studentId === student.id
            );
            const isTrained = (data?.imageCount || 0) > 0;
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
                  {isTrained ? `${data?.imageCount} Imgs` : "No Data"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
