import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { UserRole } from "../types";
import {
	ScanFace,
	ArrowRight,
	Lock,
	Users,
	School,
	Key,
	User,
	EyeOff,
	Eye,
} from "lucide-react";

interface HomeProps {
	onNavigate: (page: string) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
	const { login, currentUser, users } = useApp();
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");

	const handleLogin = (e: React.FormEvent) => {
		e.preventDefault();
		if (login(identifier, password)) {
			setError("");
			// Redirect based on role
			const user = users.find(
				(u) => u.email === identifier || u.enrollmentNo === identifier
			);
			if (user?.role === UserRole.FACULTY) onNavigate("faculty");
			else if (user?.role === UserRole.STUDENT) onNavigate("student");
			else if (user?.role === UserRole.ADMIN) onNavigate("admin");
		} else {
			setError("Invalid credentials.");
		}
	};

	const startKiosk = () => {
		onNavigate("kiosk");
	};

	if (currentUser) {
		return (
			<div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-gray-50 p-4">
				<div className="text-center mb-10">
					<h1 className="text-4xl font-bold text-gray-900 mb-4">
						Welcome back, {currentUser.name}!
					</h1>
					<p className="text-lg text-gray-600">
						You are logged in as {currentUser.role}.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
					<div
						onClick={startKiosk}
						className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1 group"
					>
						<div className="bg-indigo-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
							<ScanFace className="text-indigo-600 w-8 h-8 group-hover:text-white" />
						</div>
						<h3 className="text-xl font-bold text-gray-900 mb-2">
							Give Attendance
						</h3>
						<p className="text-gray-500 mb-4">
							Launch the kiosk mode to mark attendance for an
							active live class.
						</p>
						<div className="flex items-center text-indigo-600 font-medium">
							Launch Kiosk{" "}
							<ArrowRight
								size={16}
								className="ml-2 group-hover:translate-x-1 transition-transform"
							/>
						</div>
					</div>

					{currentUser.role === UserRole.FACULTY && (
						<div
							onClick={() => onNavigate("faculty")}
							className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1 group"
						>
							<div className="bg-green-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-600 transition-colors">
								<School className="text-green-600 w-8 h-8 group-hover:text-white" />
							</div>
							<h3 className="text-xl font-bold text-gray-900 mb-2">
								Manage Classes
							</h3>
							<p className="text-gray-500 mb-4">
								Start sessions and view live statistics for your
								subjects.
							</p>
							<div className="flex items-center text-green-600 font-medium">
								Go to Dashboard{" "}
								<ArrowRight
									size={16}
									className="ml-2 group-hover:translate-x-1 transition-transform"
								/>
							</div>
						</div>
					)}

					{currentUser.role === UserRole.STUDENT && (
						<div
							onClick={() => onNavigate("student")}
							className="bg-white p-8 rounded-2xl shadow-md border border-gray-100 cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1 group"
						>
							<div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
								<Users className="text-blue-600 w-8 h-8 group-hover:text-white" />
							</div>
							<h3 className="text-xl font-bold text-gray-900 mb-2">
								My Reports
							</h3>
							<p className="text-gray-500 mb-4">
								Check your attendance history and percentage per
								subject.
							</p>
							<div className="flex items-center text-blue-600 font-medium">
								View Attendance{" "}
								<ArrowRight
									size={16}
									className="ml-2 group-hover:translate-x-1 transition-transform"
								/>
							</div>
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-[calc(100vh-64px)] flex flex-col md:flex-row">
			{/* Left Side: Hero & Quick Action */}
			<div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-indigo-50">
				<div className="max-w-md mx-auto">
					<h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
						Smart Attendance with{" "}
						<span className="text-indigo-600">
							Face Recognition
						</span>
					</h1>
					<p className="text-lg text-gray-600 mb-10">
						Seamlessly mark attendance for live classes using our
						AI-powered kiosk system.
					</p>

					<button
						onClick={startKiosk}
						className="w-full bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center"
					>
						<ScanFace className="mr-3" />
						Give Attendance Now
					</button>
					<p className="mt-4 text-sm text-gray-500 text-center">
						No login required for students to mark attendance.
					</p>
				</div>
			</div>

			{/* Right Side: Login */}
			<div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white">
				<div className="max-w-md mx-auto w-full">
					<div className="mb-8">
						<h2 className="text-2xl font-bold text-gray-900">
							System Login
						</h2>
						<p className="text-gray-500">Access your dashboard</p>
					</div>

					<form onSubmit={handleLogin} className="space-y-6">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Email or Enrollment No
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<User size={18} className="text-gray-400" />
								</div>
								<input
									type="text"
									value={identifier}
									onChange={(e) =>
										setIdentifier(e.target.value)
									}
									className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
									placeholder="e.g. STU001 or alice@edu.com"
									required
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Password
							</label>

							<div className="relative">
								{/* Left Icon */}
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Key size={18} className="text-gray-400" />
								</div>

								{/* Password Input */}
								<input
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) =>
										setPassword(e.target.value)
									}
									className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
									placeholder="Enter your password"
									required
								/>

								{/* Toggle Icon */}
								<button
									type="button"
									onClick={() =>
										setShowPassword(!showPassword)
									}
									className="absolute inset-y-0 right-0 pr-3 flex items-center"
								>
									{showPassword ? (
										<EyeOff size={18} className="text-gray-400"/>
									) : (
										<Eye size={18}  className="text-gray-400"/>
									)}
								</button>
							</div>
						</div>

						{error && (
							<p className="text-red-500 text-sm">{error}</p>
						)}

						<button
							type="submit"
							className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
						>
							Sign In
						</button>
					</form>

					{/* Dummy Credentials Table */}
					<div className="mt-12 bg-gray-50 p-6 rounded-xl border border-gray-200">
						<h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
							Demo Credentials
						</h3>
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm text-left">
								<thead>
									<tr className="border-b border-gray-200">
										<th className="pb-2 font-medium text-gray-700">
											Role
										</th>
										<th className="pb-2 font-medium text-gray-700">
											Enrollment / Email
										</th>
										<th className="pb-2 font-medium text-gray-700">
											Password
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-100">
									<tr>
										<td className="py-2 text-gray-600">
											Student
										</td>
										<td className="py-2 font-mono text-gray-800">
											STU001
										</td>
										<td className="py-2 font-mono text-gray-500">
											password123
										</td>
									</tr>
									<tr>
										<td className="py-2 text-gray-600">
											Faculty
										</td>
										<td className="py-2 font-mono text-gray-800">
											FAC001
										</td>
										<td className="py-2 font-mono text-gray-500">
											admin
										</td>
									</tr>
									<tr>
										<td className="py-2 text-gray-600">
											Admin
										</td>
										<td className="py-2 font-mono text-gray-800">
											admin@edu.com
										</td>
										<td className="py-2 font-mono text-gray-500">
											admin
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Home;
