import React, { useState } from "react";
import IntroPage from "./components/introPage";

function App() {
  const [showModal, setShowModal] = useState(false);
  const [isLogin, setIsLogin] = useState(false); // start with Sign Up modal

  const toggleMode = () => setIsLogin(!isLogin);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100 font-sans flex flex-col">
      
      

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-4 md:px-20">
        <h1 className="text-5xl md:text-6xl font-extrabold text-indigo-700 mb-6">
          Arrive
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-2xl">
          Smart attendance system using face recognition. Mark attendance automatically, securely, and effortlessly.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 transition"
        >
          Get Started
        </button>
      </main>

      {/* Footer */}
      <footer className="text-gray-500 text-sm text-center py-6">
        &copy; {new Date().getFullYear()} Arrive. All rights reserved.
      </footer>

      {/* Sign Up / Sign In Modal */}
      {showModal && (
        <IntroPage
          isLogin={isLogin}
          toggleMode={toggleMode}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

export default App;
