import React, { useState, useEffect } from "react";
import { AppProvider } from "./context/AppContext";
import { useApp } from "./context/AppContext";
import { UserRole } from "./types";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Kiosk from "./pages/Kiosk";

type Page = "home" | "student" | "faculty" | "admin" | "kiosk";

const AppContent: React.FC = () => {
	const { currentUser, authLoading } = useApp();
	const [currentPage, setCurrentPage] = useState<Page>("home");

	// 1) Restore last page from localStorage on first mount
	useEffect(() => {
		const saved = localStorage.getItem("currentPage") as Page | null;
		if (saved) {
			setCurrentPage(saved);
		}
	}, []);

	// 2) Persist page changes to localStorage
	useEffect(() => {
		localStorage.setItem("currentPage", currentPage);
	}, [currentPage]);

	// 3) After auth is initialized, send logged-in users to their dashboard
	useEffect(() => {
		if (authLoading) return;

		if (currentUser) {
			// If user already on some page (e.g. kiosk), don't force change unless they're on home
			if (currentPage !== "home") return;

			if (currentUser.role === UserRole.STUDENT) {
				setCurrentPage("student");
			} else if (currentUser.role === UserRole.FACULTY) {
				setCurrentPage("faculty");
			} else if (currentUser.role === UserRole.ADMIN) {
				setCurrentPage("admin");
			}
		} else {
			// no currentUser → default to home (unless kiosk)
			if (currentPage !== "kiosk") {
				setCurrentPage("home");
			}
		}
	}, [authLoading, currentUser, currentPage]);

	const renderPage = () => {
		switch (currentPage) {
			case "home":
				return <Home onNavigate={setCurrentPage} />;
			case "student":
				return <StudentDashboard />;
			case "faculty":
				return <FacultyDashboard onNavigate={setCurrentPage} />;
			case "admin":
				return <AdminDashboard />;
			case "kiosk":
				return <Kiosk onNavigate={setCurrentPage} />;
			default:
				return <Home onNavigate={setCurrentPage} />;
		}
	};

	// Optional: show a small loading state while auth is initializing
	if (authLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<span className="text-gray-600 text-sm">
					Loading session...
				</span>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 font-sans">
			{currentPage !== "kiosk" && (
				<Navbar onNavigate={setCurrentPage} currentPage={currentPage} />
			)}
			<main>{renderPage()}</main>
		</div>
	);
};

const App: React.FC = () => {
	return (
		<AppProvider>
			<AppContent />
		</AppProvider>
	);
};

export default App;
