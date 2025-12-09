import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";
import {
	User,
	ClassSession,
	AttendanceRecord,
	UserRole,
	Subject,
	MockFaceData,
} from "../types";
import { MOCK_USERS, MOCK_SUBJECTS } from "../constants";
import { api, setAuthToken } from "../apiClient";

interface AppContextType {
	currentUser: User | null;
	authLoading: boolean;
	users: User[];
	subjects: Subject[];
	sessions: ClassSession[];
	attendanceRecords: AttendanceRecord[];
	faceDatabase: MockFaceData[];
	login: (identifier: string, password?: string) => Promise<boolean>;
	logout: () => void;
	startSession: (
		subjectId: string,
		startTime: string,
		endTime: string
	) => ClassSession;
	endSession: (sessionId: string) => void;
	markAttendance: (
		imageDataUrlOrBase64: string,
		sessionId: string
	) => Promise<any>;
	trainModel: (studentId: string, images: File[]) => Promise<void>;
	getActiveSession: (facultyId?: string) => ClassSession | undefined;
	addUser: (user: Omit<User, "id" | "avatar">) => void;
	addSubject: (subject: Omit<Subject, "id">) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [authLoading, setAuthLoading] = useState(true);
	const [users, setUsers] = useState<User[]>(MOCK_USERS);
	const [subjects, setSubjects] = useState<Subject[]>(MOCK_SUBJECTS);
	const [sessions, setSessions] = useState<ClassSession[]>([]);
	const [attendanceRecords, setAttendanceRecords] = useState<
		AttendanceRecord[]
	>([]);
	const [faceDatabase, setFaceDatabase] = useState<MockFaceData[]>(
		MOCK_USERS.filter((u) => u.role === UserRole.STUDENT).map((u) => ({
			studentId: u.id,
			imageCount: 3,
		}))
	);

	// --- AUTH & bootstrapping ---
	useEffect(() => {
		const token = localStorage.getItem("token");
		const init = async () => {
			try {
				if (token) {
					setAuthToken(token);

					const meRes = await api.get("/api/auth/me");
					if (meRes.data?.user) {
						setCurrentUser(normalizeUser(meRes.data.user));
					}
				}

				await Promise.all([
					fetchAllSubjects(),
					fetchAllUsers(),
					fetchAllSessions(),
				]);
				await fetchAllAttendance();
			} catch (err) {
				console.warn("auth init failed", err);
				localStorage.removeItem("token");
				setAuthToken(null);
				setCurrentUser(null);
			} finally {
				setAuthLoading(false);
			}
		};

		init();
	}, []);

	const normalizeUser = (u: any): User => ({
		id: u.id,
		// backend: full_name or name → frontend: name
		name: u.full_name ?? u.name ?? "",
		email: u.email ?? "",
		role: u.role as UserRole,
		// backend: enrollment_no → frontend: enrollmentNo
		enrollmentNo: u.enrollment_no ?? u.enrollmentNo ?? "",
		semester: u.semester ?? null,
		avatar:
			u.avatar ||
			`https://ui-avatars.com/api/?name=${encodeURIComponent(
				u.full_name ?? u.name ?? "User"
			)}`,
		// adjust according to your backend
		subjectIds: u.subject_ids ?? u.subjectIds ?? [],
	});

	const normalizeSession = (s: any): ClassSession => ({
		id: s.id,
		subjectId: s.subject_id ?? s.subjectId,
		facultyId: s.faculty_id ?? s.facultyId ?? null,
		startTime: s.start_time ?? s.startTime,
		endTime: s.end_time ?? s.endTime ?? null,
		isActive: s.is_active ?? s.isActive ?? true,
	});

	const normalizeAttendance = (a: any): AttendanceRecord => ({
		id: a.id,
		sessionId: a.session_id ?? a.sessionId,
		studentId: a.student_id ?? a.studentId,
		timestamp: a.timestamp ?? a.created_at ?? a.timestamp,
		status: a.status,
		confidence: a.confidence,
		imagePath: a.image_path ?? a.imagePath,
	});

	// ---------- Fetch helpers ----------
	async function fetchAllUsers() {
		try {
			const res = await api.get("/api/admin/users");
			const normalized = res.data.map((u: any) => normalizeUser(u));
			setUsers(normalized);
		} catch (err) {
			console.warn("fetch users failed", err);
		}
	}

	async function fetchAllSubjects() {
		try {
			const res = await api.get("/api/subjects");
			setSubjects(res.data);
		} catch (err) {
			console.warn("fetch subjects failed", err);
		}
	}

	async function fetchAllSessions() {
		try {
			const res = await api.get("/api/sessions"); // was /api/sessions/active
			const normalized = res.data.map((s: any) => normalizeSession(s));
			setSessions(normalized);
		} catch (err) {
			console.warn("fetch sessions failed", err);
		}
	}

	async function fetchAllAttendance() {
		try {
			const res = await api.get("/api/attendance");
			const normalized = res.data.map((a: any) => normalizeAttendance(a));
			setAttendanceRecords(normalized);
		} catch (err) {
			console.warn("fetch attendance failed", err);
		}
	}

	// ---------- AUTH ----------
	const login = async (
		identifier: string,
		password?: string
	): Promise<boolean> => {
		try {
			const form = new FormData();
			form.append("identifier", identifier);
			form.append("password", password || "");
			const res = await api.post("/api/auth/login", form);
			const token = res.data.access_token;
			if (token) {
				localStorage.setItem("token", token);
				setAuthToken(token);
				// optional: set currentUser from response
				if (res.data.user) setCurrentUser(normalizeUser(res.data.user));
				// refresh lists
				await Promise.all([
					fetchAllUsers(),
					fetchAllSubjects(),
					fetchAllSessions(),
				]);
				return true;
			}
			return false;
		} catch (err) {
			console.error("login failed", err);
			return false;
		}
	};

	const logout = () => {
		localStorage.removeItem("token");
		setAuthToken(null);
		setCurrentUser(null);
	};

	// ---------- ADMIN ----------
	const addUser = async (userData: Omit<User, "id" | "avatar">) => {
		try {
			const payload = {
				email: userData.email,
				// decide how you want to set password when admin creates user:
				password:
					(userData as any).password ??
					userData.enrollmentNo ??
					"changeme123",
				full_name:
					(userData as any).full_name ?? (userData as any).name ?? "",
				role: userData.role,
				enrollment_no:
					(userData as any).enrollment_no ??
					(userData as any).enrollmentNo ??
					null,
				semester: userData.semester ?? null,
			};

			const res = await api.post("/api/admin/users", payload);

			const created = normalizeUser(res.data);

			// If this is a STUDENT and we have selected subjects, enroll them
			if (
				created.role !== UserRole.ADMIN &&
				(userData as any).subjectIds &&
				(userData as any).subjectIds.length > 0
			) {
				const subjectIds = (userData as any).subjectIds as string[];

				// For each subjectId, find the subject code and call enrollStudentToSubject
				for (const sid of subjectIds) {
					const sub = subjects.find((s) => s.id === sid);
					if (!sub) continue;
					await enrollSubject(created.enrollmentNo, sub.code);
				}
			}

			// refresh user list
			await fetchAllUsers();
			return res.data;
		} catch (err) {
			console.error("addUser failed", err);
			throw err;
		}
	};

	const addSubject = async (subjectData: Omit<Subject, "id">) => {
		try {
			// backend previously expects form-data, but it also accepts JSON in our API—use JSON:
			const fd = new FormData();
			fd.append("name", subjectData.name);
			fd.append("code", subjectData.code);

			const res = await api.post("/api/admin/subjects", fd, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			await fetchAllSubjects();
			return res.data;
		} catch (err) {
			console.error("addSubject failed", err);
			throw err;
		}
	};

	// Train: multiple files upload for enrollment_no
	const trainModel = async (enrollmentNo: string, files: File[]) => {
		try {
			const fd = new FormData();
			fd.append("enrollment_no", enrollmentNo);
			files.forEach((f) => fd.append("files", f));

			const res = await api.post("/api/admin/train-face", fd, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			// find student by enrollmentNo
			const student = users.find((u) => u.enrollmentNo === enrollmentNo);
			if (!student) {
				console.warn("No student found for enrollmentNo", enrollmentNo);
				return res.data;
			}

			setFaceDatabase((prev) => {
				const idx = prev.findIndex((p) => p.studentId === student.id);
				if (idx !== -1) {
					const updated = [...prev];
					updated[idx] = {
						...updated[idx],
						imageCount:
							(updated[idx].imageCount || 0) +
							(res.data.accepted || 0),
					};
					return updated;
				}
				return [
					...prev,
					{
						studentId: student.id,
						imageCount: res.data.accepted || 0,
					},
				];
			});

			return res.data;
		} catch (err) {
			console.error("trainModel error", err);
			throw err;
		}
	};

	// enroll student to subject (helper)
	const enrollSubject = async (enrollmentNo: string, subjectCode: string) => {
		try {
			const fd = new FormData();
			fd.append("enrollment_no", enrollmentNo);
			fd.append("subject_code", subjectCode);
			const res = await api.post("/api/admin/enroll-subject", fd);
			// refresh data if necessary
			await fetchAllUsers();
			return res.data;
		} catch (err) {
			console.error("enrollSubject failed", err);
			throw err;
		}
	};

	// ---------- FACULTY ----------
	const startSession = async (
		subjectIdOrCode: string,
		startTime: string,
		endTime: string
	) => {
		try {
			// Map subject id -> subject_code if needed
			const sub =
				subjects.find((s) => s.id === subjectIdOrCode) ||
				subjects.find((s) => s.code === subjectIdOrCode);

			const payload = {
				subject_code: sub ? sub.code : subjectIdOrCode,
				start_time: new Date(startTime).toISOString(),
				end_time: new Date(endTime).toISOString(),
				faculty_id: currentUser?.id || undefined,
			};

			const res = await api.post("/api/sessions/start", payload);
			await fetchAllSessions(); // refresh list with new active session
			return res.data;
		} catch (err) {
			console.error("startSession failed", err);
			throw err;
		}
	};

	const endSession = async (sessionId: string) => {
		try {
			await api.post(`/api/sessions/${sessionId}/end`);
			await fetchAllSessions();
			return true;
		} catch (err) {
			console.error("endSession failed", err);
			throw err;
		}
	};

	// ---------- KIOSK ----------
	// markAttendance expects sessionId + base64 image (without data: prefix)
	const markAttendance = async (
		imageDataUrlOrBase64: string,
		sessionId: string
	) => {
		try {
			const raw = imageDataUrlOrBase64.startsWith("data:")
				? imageDataUrlOrBase64.split(",")[1]
				: imageDataUrlOrBase64;

			const fd = new FormData();
			fd.append("session_id", sessionId);
			fd.append("imageBase64", raw);

			const res = await api.post("/api/kiosk/mark-attendance", fd, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			// If attendance was actually recorded, refresh attendance from backend
			if (res.data?.status === "matched") {
				await fetchAllAttendance();
			}

			return res.data;
		} catch (err) {
			console.error("markAttendance failed", err);
			throw err;
		}
	};

	const dataURLtoBlob = (dataUrl: string): Blob => {
		const [meta, base64] = dataUrl.split(",");
		const mime = meta.match(/:(.*?);/)?.[1] || "image/jpeg";
		const binary = atob(base64);
		const len = binary.length;
		const bytes = new Uint8Array(len);
		for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
		return new Blob([bytes], { type: mime });
	};

	const markAttendanceMultiCam = async (
		sessionId: string,
		frames: { cameraIndex: number; frameIndex: number; dataUrl: string }[]
	) => {
		const fd = new FormData();
		fd.append("session_id", sessionId);

		frames.forEach((f) => {
			const blob = dataURLtoBlob(f.dataUrl);
			fd.append(
				"files",
				blob,
				`cam${f.cameraIndex + 1}_frame${f.frameIndex + 1}.jpg`
			);
		});

		const res = await api.post("/api/kiosk/mark-attendance-multicam", fd, {
			headers: { "Content-Type": "multipart/form-data" },
		});

		if (res.data.status === "matched") {
			await fetchAllAttendance();
		}

		return res.data;
	};

	// ---------- return context ----------
	return (
		<AppContext.Provider
			value={{
				currentUser,
				authLoading,
				users,
				subjects,
				sessions,
				attendanceRecords,
				faceDatabase,
				login,
				logout,
				startSession,
				endSession,
				markAttendance,
				trainModel,
				getActiveSession: (facultyId?: string) => {
					const now = new Date();

					return sessions.find((s) => {
						if (!s.isActive) return false;
						if (facultyId && s.facultyId !== facultyId)
							return false;

						// If no endTime → treat as manually-ended session (still active until explicitly ended)
						if (!s.endTime) return true;

						// Only active if endTime is still in the future
						return new Date(s.endTime) > now;
					});
				},
				markAttendanceMultiCam,
				addUser,
				addSubject,
			}}
		>
			{children}
		</AppContext.Provider>
	);
};

export const useApp = () => {
	const context = useContext(AppContext);
	if (context === undefined) {
		throw new Error("useApp must be used within an AppProvider");
	}
	return context;
};
