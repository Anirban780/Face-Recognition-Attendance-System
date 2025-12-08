import React, { useState } from "react";
import {
  PlusCircle,
  CheckCircle,
  Users,
  Search,
  EyeOff,
  Eye,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { UserRole } from "../types";

export const ManageUsersTab: React.FC = () => {
  const { users, addUser, subjects } = useApp();

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    enrollmentNo: "",
    password: "",
    role: UserRole.STUDENT,
    semester: 0,
    subjectIds: [] as string[],
  });
  const [userMessage, setUserMessage] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const toggleSubject = (subjectId: string) => {
    setNewUser((prev) => {
      if (prev.subjectIds.includes(subjectId)) {
        return {
          ...prev,
          subjectIds: prev.subjectIds.filter((id) => id !== subjectId),
        };
      } else {
        return { ...prev, subjectIds: [...prev.subjectIds, subjectId] };
      }
    });
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.name && newUser.email && newUser.password) {
      addUser(newUser);
      setNewUser({
        name: "",
        email: "",
        enrollmentNo: "",
        password: "",
        role: UserRole.STUDENT,
        semester: 1,
        subjectIds: [],
      });
      setUserMessage("User added successfully.");
      setTimeout(() => setUserMessage(""), 3000);
    }
  };

  // Filter users for list
  const filteredUsers = users.filter((u) => {
    const name = u.name ?? "";
    const email = u.email ?? "";
    const enroll = u.enrollmentNo ?? "";
    const search = userSearch?.toLowerCase() ?? "";

    return (
      name.toLowerCase().includes(search) ||
      email.toLowerCase().includes(search) ||
      enroll.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ADD USER FORM */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center mb-6">
          <div className="bg-green-100 p-2 rounded-lg mr-4">
            <PlusCircle className="text-green-600" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Register New User
            </h2>
            <p className="text-sm text-gray-500">
              Add students, faculty, or admins
            </p>
          </div>
        </div>

        <form onSubmit={handleAddUser} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-green-500 focus:border-green-500"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-green-500 focus:border-green-500"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                placeholder="john@edu.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enrollment / Staff ID
              </label>
              <input
                type="text"
                className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-green-500 focus:border-green-500"
                value={newUser.enrollmentNo}
                onChange={(e) =>
                  setNewUser({ ...newUser, enrollmentNo: e.target.value })
                }
                placeholder="e.g. STU001 or FAC005"
              />
            </div>

            {/* Password with show/hide */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Set Password
              </label>

              <input
                type={showPassword ? "text" : "password"}
                required
                className="block w-full border border-gray-300 rounded-lg p-3 pr-12 focus:ring-green-500 focus:border-green-500"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                placeholder="********"
              />

              <button
                type="button"
                className="absolute right-3 top-12 bottom-5 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-green-500 focus:border-green-500"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({
                    ...newUser,
                    role: e.target.value as UserRole,
                  })
                }
              >
                <option value={UserRole.STUDENT}>Student</option>
                <option value={UserRole.FACULTY}>Faculty</option>
                <option value={UserRole.ADMIN}>Admin</option>
              </select>
            </div>
            {newUser.role === UserRole.STUDENT && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester
                </label>
                <input
                  type="number"
                  className="block w-full border border-gray-300 rounded-lg p-3 focus:ring-green-500 focus:border-green-500"
                  value={newUser.semester}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      semester: parseInt(e.target.value),
                    })
                  }
                  min={1}
                  max={8}
                />
              </div>
            )}
          </div>

          {newUser.role !== UserRole.ADMIN && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Subjects
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border border-gray-200 p-3 rounded-lg max-h-40 overflow-y-auto">
                {subjects.map((sub) => (
                  <label
                    key={sub.id}
                    className="flex items-center space-x-2 text-sm p-1 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={newUser.subjectIds.includes(sub.id)}
                      onChange={() => toggleSubject(sub.id)}
                      className="rounded text-green-600 focus:ring-green-500"
                    />
                    <span>
                      {sub.name} ({sub.code})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <PlusCircle className="mr-2" size={18} /> Add User
          </button>

          {userMessage && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg flex items-center border border-green-200">
              <CheckCircle size={18} className="mr-2" />
              {userMessage}
            </div>
          )}
        </form>
      </div>

      {/* USERS LIST TABLE */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Users className="mr-2" size={20} /> Registered Users
          </h3>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Profile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Academic Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subjects
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded-full"
                            src={user.avatar}
                            alt=""
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${
                            user.role === UserRole.STUDENT
                              ? "bg-blue-100 text-blue-800"
                              : user.role === UserRole.FACULTY
                              ? "bg-green-100 text-green-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.enrollmentNo || "-"}
                      </div>
                      {user.role === UserRole.STUDENT && (
                        <div className="text-xs text-gray-500">
                          Sem: {user.semester}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 flex flex-wrap gap-1">
                        {user.subjectIds && user.subjectIds.length > 0 ? (
                          user.subjectIds.map((sid: string) => {
                            const sub = subjects.find((s) => s.id === sid);
                            return sub ? (
                              <span
                                key={sid}
                                className="px-2 py-0.5 bg-gray-100 rounded text-xs border border-gray-200"
                              >
                                {sub.code}
                              </span>
                            ) : null;
                          })
                        ) : (
                          <span className="text-gray-400 italic">None</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No users found matching your search.
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
