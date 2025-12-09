import React, { useState } from "react";
import { PlusCircle, CheckCircle, BookOpen } from "lucide-react";
import { useApp } from "../context/AppContext";

export const SubjectsTab: React.FC = () => {
  const { subjects, addSubject } = useApp();

  const [newSubject, setNewSubject] = useState({ name: "", code: "" });
  const [subjectMessage, setSubjectMessage] = useState("");

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubject.name && newSubject.code) {
      addSubject(newSubject);
      setNewSubject({ name: "", code: "" });
      setSubjectMessage("Subject added successfully.");
      setTimeout(() => setSubjectMessage(""), 3000);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ADD SUBJECT FORM */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center mb-6">
          <div className="bg-blue-100 p-2 rounded-lg mr-4">
            <BookOpen className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Add New Subject
            </h2>
            <p className="text-sm text-gray-500">
              Create course entries for the system
            </p>
          </div>
        </div>

        <form onSubmit={handleAddSubject} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Name
              </label>
              <input
                type="text"
                required
                className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"
                value={newSubject.name}
                onChange={(e) =>
                  setNewSubject({ ...newSubject, name: e.target.value })
                }
                placeholder="Advanced Computer Vision"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Code
              </label>
              <input
                type="text"
                required
                className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"
                value={newSubject.code}
                onChange={(e) =>
                  setNewSubject({ ...newSubject, code: e.target.value })
                }
                placeholder="CS405"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <PlusCircle className="mr-2" size={18} /> Create Subject
          </button>

          {subjectMessage && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg flex items-center border border-green-200">
              <CheckCircle size={18} className="mr-2" />
              {subjectMessage}
            </div>
          )}
        </form>
      </div>

      {/* SUBJECTS LIST TABLE */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
          <BookOpen className="mr-2" size={20} /> Subject Inventory
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  System ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subjects.length > 0 ? (
                subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                        {sub.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sub.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {sub.id}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No subjects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
