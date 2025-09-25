// App.jsx - Redesigned
import { useState, useEffect } from "react";
import IntroPage from "./components/introPage";
import StudentDashboard from "./Pages/StudentDashboard";
import TeacherDashboard from "./Pages/TeacherDashboard";

function App() {
  const [showModal, setShowModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const toggleMode = () => setIsLogin(!isLogin);

  // Manual navigation function
  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle user state and navigation on load or user change
  useEffect(() => {
    if (user) {
      if (user.role === "student" && currentPath !== "/student") {
        navigate("/student");
      } else if (user.role === "teacher" && currentPath !== "/teacher") {
        navigate("/teacher");
      }
    }
  }, [user, currentPath]);

  // Render content based on current path and user role
  const renderContent = () => {
    if (user?.role === "student" && currentPath === "/student") {
      return <StudentDashboard user={user} />;
    }
    
    if (user?.role === "teacher" && currentPath === "/teacher") {
      return <TeacherDashboard user={user} />;
    }

    // Default home page for unauthenticated users
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-indigo-900 via-gray-900 to-purple-900 opacity-80 animate-bg-pulse"></div>
        <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/connected-dots.png')] opacity-10"></div>
        
        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <h1 className="text-6xl sm:text-7xl font-extrabold mb-4 animate-fade-in-down drop-shadow-lg">
            Arrive
          </h1>
          <p className="text-lg sm:text-xl mb-10 max-w-2xl text-gray-300 animate-fade-in-up">
            The next generation of university attendance. Seamless, secure, and smart facial recognition to make your day effortlessly efficient.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-12 py-5 bg-white text-indigo-600 font-bold rounded-full shadow-2xl hover:scale-105 transform transition-transform duration-300 ease-in-out hover:shadow-indigo-500/50"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="font-sans antialiased text-gray-900">
      {renderContent()}

      {/* Login/Signup Modal with new styling */}
      {showModal && (
        <IntroPage
          isLogin={isLogin}
          toggleMode={toggleMode}
          onClose={() => setShowModal(false)}
          setUser={setUser}
          onNavigate={navigate}
        />
      )}
    </div>
  );
}

export default App;