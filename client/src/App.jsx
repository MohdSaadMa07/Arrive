// App.jsx - Manual routing without hooks
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

  // Render based on current path
  const renderContent = () => {
    if (currentPath === "/student" && user?.role === "student") {
      return <StudentDashboard user={user} />;
    }
    
    if (currentPath === "/teacher" && user?.role === "teacher") {
      return <TeacherDashboard user={user} />;
    }

    // Redirect logic
    if (user) {
      if (user.role === "student") {
        navigate("/student");
        return <StudentDashboard user={user} />;
      } else {
        navigate("/teacher");
        return <TeacherDashboard user={user} />;
      }
    }

    // Default home page
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-4">
        <h1 className="text-5xl font-bold mb-4">Arrive</h1>
        <p className="text-lg mb-8 text-center max-w-xl">
          Smart attendance system using face recognition. Sign up to start marking attendance effortlessly!
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-2xl shadow-lg hover:shadow-xl transition"
        >
          Get Started
        </button>
      </div>
    );
  };

  return (
    <div>
      {/* Login/Signup Modal */}
      {showModal && (
        <IntroPage
          isLogin={isLogin}
          toggleMode={toggleMode}
          onClose={() => setShowModal(false)}
          setUser={setUser}
          onNavigate={navigate} // Pass manual navigate function
        />
      )}

      {renderContent()}
    </div>
  );
}

export default App;