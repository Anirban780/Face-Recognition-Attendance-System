import React, { useState } from "react";
import { Database, Users, BookOpen } from "lucide-react";
import { TrainModelTab } from "../components/TrainModelTab";
import { ManageUsersTab } from "../components/ManageUsersTab";
import { SubjectsTab } from "../components/SubjectsTab";

type AdminTab = "train" | "users" | "subjects";

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("train");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Admin Console
      </h1>

      {/* Navigation Tabs */}
      <div className="flex space-x-4 mb-8 border-b border-gray-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("train")}
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === "train"
              ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center">
            <Database size={16} className="mr-2" /> Train Model
          </div>
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === "users"
              ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center">
            <Users size={16} className="mr-2" /> Manage Users
          </div>
        </button>
        <button
          onClick={() => setActiveTab("subjects")}
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === "subjects"
              ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center">
            <BookOpen size={16} className="mr-2" /> Manage Subjects
          </div>
        </button>
      </div>

      <div className="w-full">
        {activeTab === "train" && <TrainModelTab />}
        {activeTab === "users" && <ManageUsersTab />}
        {activeTab === "subjects" && <SubjectsTab />}
      </div>
    </div>
  );
};

export default AdminDashboard;
