import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Play, Square, Users, Calendar } from "lucide-react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import { UserRole } from "../types";

interface FacultyDashboardProps {
	onNavigate: (page: string) => void;
}

const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ onNavigate }) => {
	const {
		currentUser,
		subjects,
		sessions,
		attendanceRecords,
		startSession,
		endSession,
		users,
	} = useApp();

	const [selectedSubject, setSelectedSubject] = useState("");
	const [sessionError, setSessionError] = useState<string>("");

	// Default start time: now (local)
	const [startTime, setStartTime] = useState(() => {
		const now = new Date();
		now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
		return now.toISOString().slice(0, 16);
	});

	// Default end time: now + 1 hour (local)
	const [endTime, setEndTime] = useState(() => {
		const now = new Date();
		now.setHours(now.getHours() + 1);
		now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
		return now.toISOString().slice(0, 16);
	});

	if (!currentUser) return null;

	// ✅ Subjects assigned to this faculty (by subjectIds array)
	const facultySubjects = subjects.filter((sub) =>
		currentUser.subjectIds?.includes(sub.id)
	);

	const mySessions = sessions.filter((s) => s.facultyId === currentUser.id);

	const now = new Date();

	const activeSession = mySessions.find((s) => {
		if (!s.isActive) return false;
		if (!s.endTime) return true; // manual end only
		return new Date(s.endTime) > now; // only active if endTime is still in the future
	});

	// Live stats for active session
	const [liveStats, setLiveStats] = useState<any[]>([]);
	const [assignedStudentsForActive, setAssignedStudentsForActive] = useState<
		any[]
	>([]);
	const [presentStudentsForActive, setPresentStudentsForActive] = useState<
		any[]
	>([]);

	const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
		null
	);

	useEffect(() => {
		if (activeSession) {
			const records = attendanceRecords.filter(
				(r) => r.sessionId === activeSession.id
			);

			// Students who are supposed to attend this subject
			const assignedStudents = users.filter(
				(u) =>
					u.role === UserRole.STUDENT &&
					u.subjectIds?.includes(activeSession.subjectId)
			);

			const presentIds = new Set(
				records.map((r: any) => r.studentId) // assuming attendanceRecords have studentId
			);

			const presentStudents = assignedStudents.filter((s) =>
				presentIds.has(s.id)
			);

			const presentCount = presentStudents.length;
			const absentCount = assignedStudents.length - presentCount;

			setAssignedStudentsForActive(assignedStudents);
			setPresentStudentsForActive(presentStudents);

			setLiveStats([
				{ name: "Present", value: presentCount, fill: "#4ade80" },
				{
					name: "Absent",
					value: Math.max(0, absentCount),
					fill: "#f87171",
				},
			]);
		} else {
			setLiveStats([]);
			setAssignedStudentsForActive([]);
			setPresentStudentsForActive([]);
		}
	}, [attendanceRecords, activeSession, users]);

	const handleStartSession = async () => {
		if (!selectedSubject || !startTime || !endTime) return;

		try {
			setSessionError("");
			await startSession(selectedSubject, startTime, endTime);
			// AppContext.startSession calls fetchAllSessions, so sessions & activeSession update
		} catch (err: any) {
			const msg =
				err?.response?.data?.detail ||
				"Could not start session. Please try again.";
			setSessionError(msg);
		}
	};

	const handleEndSession = async () => {
		if (!activeSession) return;
		try {
			setSessionError("");
			await endSession(activeSession.id);
			// fetchAllSessions in endSession updates activeSession to null
		} catch (err: any) {
			const msg =
				err?.response?.data?.detail ||
				"Could not end session. Please try again.";
			setSessionError(msg);
		}
	};

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<h1 className="text-2xl font-bold text-gray-900 mb-8">
				Faculty Dashboard
			</h1>

			{/* Active Session Control */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
				<div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
					<h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
						<Calendar className="mr-2 text-indigo-600" size={20} />
						Class Controls
					</h2>

					{activeSession ? (
						// ✅ WHEN CLASS IS LIVE
						<div className="space-y-6">
							<div className="p-4 bg-green-50 border border-green-200 rounded-xl">
								<div className="flex items-center justify-between mb-2">
									<span className="text-sm font-medium text-green-800">
										Status
									</span>
									<span className="px-2 py-1 bg-green-200 text-green-800 text-xs font-bold rounded uppercase">
										Live
									</span>
								</div>
								<p className="text-lg font-bold text-gray-900">
									{
										subjects.find(
											(s) =>
												s.id === activeSession.subjectId
										)?.name
									}
								</p>
								<div className="mt-2 text-sm text-gray-600">
									<p>
										Start:{" "}
										{new Date(
											activeSession.startTime
										).toLocaleTimeString()}
									</p>
									<p>
										End:{" "}
										{activeSession.endTime
											? new Date(
													activeSession.endTime
											  ).toLocaleTimeString()
											: "Manual"}
									</p>
								</div>
							</div>

							{sessionError && (
								<div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
									{sessionError}
								</div>
							)}

							<button
								onClick={handleEndSession}
								className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center"
							>
								<Square
									className="mr-2"
									size={18}
									fill="currentColor"
								/>{" "}
								End Class Session
							</button>

							<button
								onClick={() => onNavigate("kiosk")}
								className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center"
							>
								<Users className="mr-2" size={18} /> Open Kiosk
								View
							</button>
						</div>
					) : (
						// ✅ WHEN NO CLASS IS LIVE
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Select Subject
								</label>
								<select
									value={selectedSubject}
									onChange={(e) =>
										setSelectedSubject(e.target.value)
									}
									className="block w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
								>
									<option value="">
										-- Choose Subject --
									</option>
									{facultySubjects.length > 0 ? (
										facultySubjects.map((sub) => (
											<option key={sub.id} value={sub.id}>
												{sub.name} ({sub.code})
											</option>
										))
									) : (
										<option disabled>
											No subjects assigned
										</option>
									)}
								</select>
							</div>

							<div className="grid grid-cols-2 gap-2">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Start Time
									</label>
									<input
										type="datetime-local"
										value={startTime}
										onChange={(e) =>
											setStartTime(e.target.value)
										}
										className="block w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										End Time
									</label>
									<input
										type="datetime-local"
										value={endTime}
										onChange={(e) =>
											setEndTime(e.target.value)
										}
										className="block w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
									/>
								</div>
							</div>

							{sessionError && (
								<div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
									{sessionError}
								</div>
							)}

							<button
								onClick={handleStartSession}
								disabled={!selectedSubject}
								className={`w-full px-4 py-3 rounded-lg font-semibold flex items-center justify-center transition-colors ${
									!selectedSubject
										? "bg-gray-300 text-gray-500 cursor-not-allowed"
										: "bg-gray-900 text-white hover:bg-gray-800"
								}`}
							>
								<Play
									className="mr-2"
									size={18}
									fill="currentColor"
								/>{" "}
								Start Class Session
							</button>
						</div>
					)}
				</div>

				{/* Live Statistics */}
				<div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
					<h2 className="text-lg font-semibold text-gray-800 mb-4">
						Live Attendance Tracking
					</h2>
					{activeSession ? (
						<div className="w-full">
							{/* chart gets fixed height */}
							<div className="h-64">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart
										data={liveStats}
										layout="vertical"
									>
										<CartesianGrid
											strokeDasharray="3 3"
											horizontal={true}
											vertical={false}
										/>
										<XAxis type="number" hide />
										<YAxis
											dataKey="name"
											type="category"
											width={80}
											tick={{ fontSize: 14 }}
										/>
										<Tooltip
											cursor={{ fill: "transparent" }}
										/>
										<Bar
											dataKey="value"
											barSize={40}
											radius={[0, 4, 4, 0]}
											label={{
												position: "right",
												fill: "#666",
											}}
										/>
									</BarChart>
								</ResponsiveContainer>
							</div>

							{/* summary stays inside card, below chart */}
							<div className="mt-4">
								<p className="text-sm text-gray-700 mb-2">
									<strong>
										{presentStudentsForActive.length}
									</strong>{" "}
									present out of{" "}
									<strong>
										{assignedStudentsForActive.length}
									</strong>{" "}
									students.
								</p>
								<div className="max-h-32 overflow-y-auto border border-gray-100 rounded-lg p-2 text-sm">
									<p className="font-medium text-gray-800 mb-1">
										Present students:
									</p>
									{presentStudentsForActive.length > 0 ? (
										<ul className="list-disc pl-5 space-y-0.5">
											{presentStudentsForActive.map(
												(stu) => (
													<li key={stu.id}>
														{stu.name ||
															stu.fullName ||
															"Unnamed student"}
													</li>
												)
											)}
										</ul>
									) : (
										<p className="text-gray-400">
											No one has marked attendance yet.
										</p>
									)}
								</div>
							</div>
						</div>
					) : (
						<div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
							Start a session to view live statistics
						</div>
					)}
				</div>
			</div>

			{/* History Table (currently only shows active sessions if your API only returns active) */}
			<div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
				<div className="px-6 py-4 border-b border-gray-200">
					<h3 className="text-lg font-semibold text-gray-800">
						Recent Sessions History
					</h3>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm text-left">
						<thead className="bg-gray-50 text-gray-600 font-medium">
							<tr>
								<th className="px-6 py-3">Subject</th>
								<th className="px-6 py-3">Date</th>
								<th className="px-6 py-3">Start Time</th>
								<th className="px-6 py-3">End Time</th>
								<th className="px-6 py-3">Status</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{mySessions
								.slice()
								.sort(
									(a, b) =>
										new Date(b.startTime).getTime() -
										new Date(a.startTime).getTime()
								)
								.map((session) => {
									// 🔍 students assigned to this subject
									const assignedStudents = users.filter(
										(u) =>
											u.role === UserRole.STUDENT &&
											u.subjectIds?.includes(
												session.subjectId
											)
									);

									// 🔍 attendance records for this session
									const recordsForSession =
										attendanceRecords.filter(
											(r) => r.sessionId === session.id
										);

									const presentIds = new Set(
										recordsForSession.map(
											(r: any) => r.studentId
										)
									);
									const presentStudents =
										assignedStudents.filter((s) =>
											presentIds.has(s.id)
										);

									return (
										<React.Fragment key={session.id}>
											<tr className="hover:bg-gray-50">
												<td className="px-6 py-4 font-medium text-gray-900">
													{
														subjects.find(
															(s) =>
																s.id ===
																session.subjectId
														)?.name
													}
												</td>
												<td className="px-6 py-4 text-gray-500">
													{new Date(
														session.startTime
													).toLocaleDateString()}
												</td>
												<td className="px-6 py-4 text-gray-500">
													{new Date(
														session.startTime
													).toLocaleTimeString()}
												</td>
												<td className="px-6 py-4 text-gray-500">
													{session.endTime
														? new Date(
																session.endTime
														  ).toLocaleTimeString()
														: "-"}
												</td>
												<td className="px-6 py-4 flex items-center gap-2">
													{session.isActive ? (
														<span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
															Active
														</span>
													) : (
														<span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
															Completed
														</span>
													)}

													{/* 👇 attendance summary */}
													<span className="text-xs text-gray-600">
														{presentStudents.length}
														/
														{
															assignedStudents.length
														}{" "}
														present
													</span>

													<button
														type="button"
														onClick={() =>
															setSelectedSessionId(
																(prev) =>
																	prev ===
																	session.id
																		? null
																		: session.id
															)
														}
														className="ml-auto text-xs text-indigo-600 hover:underline"
													>
														{selectedSessionId ===
														session.id
															? "Hide"
															: "View students"}
													</button>
												</td>
											</tr>

											{/* 👇 details row when expanded */}
											{selectedSessionId ===
												session.id && (
												<tr>
													<td
														colSpan={5}
														className="px-6 py-4 bg-gray-50"
													>
														<div className="text-sm">
															<p className="font-medium text-gray-800 mb-2">
																Present students
																(
																{
																	presentStudents.length
																}
																/
																{
																	assignedStudents.length
																}
																):
															</p>
															{presentStudents.length >
															0 ? (
																<ul className="list-disc pl-5 space-y-0.5 max-h-40 overflow-y-auto">
																	{presentStudents.map(
																		(
																			stu
																		) => (
																			<li
																				key={
																					stu.id
																				}
																			>
																				{stu.name ||
																					stu.fullName ||
																					"Unnamed student"}
																				<span className="text-gray-500">
																					{" "}
																					(
																					{
																						stu.enrollmentNo
																					}
																					)
																				</span>
																			</li>
																		)
																	)}
																</ul>
															) : (
																<p className="text-gray-500">
																	No
																	attendance
																	recorded for
																	this
																	session.
																</p>
															)}
														</div>
													</td>
												</tr>
											)}
										</React.Fragment>
									);
								})}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

export default FacultyDashboard;
