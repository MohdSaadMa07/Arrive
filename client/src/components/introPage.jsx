import { useState, useRef } from "react";
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../../firebase';

const IntroPage = ({ isLogin, toggleMode, onClose, setUser, onNavigate }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [image, setImage] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // 🔹 Start webcam
  const startWebcam = async () => {
    setError("");
    try {
      setShowWebcam(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error(err);
      setError("Cannot access webcam. Check permissions.");
    }
  };

  // 🔹 Stop webcam
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowWebcam(false);
  };

  // 🔹 Capture photo
  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      setImage(canvas.toDataURL("image/jpeg"));
      stopWebcam();
    }
  };

  // 🔹 Navigate to appropriate dashboard based on role
  const navigateToDashboard = (userData) => {
    setUser(userData);
    if (userData.role === "student") {
      onNavigate("/student");
    } else if (userData.role === "teacher") {
      onNavigate("/teacher");
    } else {
      onNavigate("/");
    }
  };

  // 🔹 Handle submit (login/signup)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password || (!isLogin && (!fullName || !image))) {
      setError("Please fill all required fields.");
      setLoading(false);
      return;
    }

    try {
      let userCredential;
      let userData = null;

      if (isLogin) {
        // Firebase login
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        try {
          const res = await fetch(`http://localhost:5000/api/users/${uid}`);
          if (res.ok) {
            userData = await res.json();
          } else {
            throw new Error("Could not fetch user data");
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setError("Failed to load user profile. Please try again.");
          setLoading(false);
          return;
        }
        alert("Login successful!");
      } else {
        // Firebase signup
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Send data to backend
        const res = await fetch("http://localhost:5000/api/users/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid,
            email,
            fullName,
            role,
            studentId: role === "student" ? studentId : null,
            facultyId: role === "teacher" ? facultyId : null,
            profileImage: image,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Registration failed");

        userData = {
          uid,
          email,
          fullName,
          role,
          studentId: role === "student" ? studentId : null,
          facultyId: role === "teacher" ? facultyId : null,
          profileImage: image,
        };
        alert("Signup successful!");
      }

      onClose();
      navigateToDashboard(userData);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl bg-gray-800 rounded-3xl shadow-2xl overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-2xl font-light z-10"
        >
          ✕
        </button>

        <div className="flex flex-col md:flex-row h-full">

          {/* Left Side: The "Portal" */}
          <div className="md:w-1/2 p-8 flex flex-col justify-center items-center relative bg-gradient-to-br from-indigo-900 to-slate-900 text-white overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-20" style={{
                backgroundImage: "radial-gradient(#ffffff33 1px, transparent 1px)",
                backgroundSize: "20px 20px"
            }}></div>
            <div className="relative z-10 w-full flex flex-col items-center">
              <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full border-2 border-indigo-400 p-1 flex items-center justify-center mb-6">
                <div className="w-full h-full rounded-full overflow-hidden">
                  {showWebcam ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : image ? (
                    <img src={image} alt="Captured" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full bg-gray-700 text-gray-400 text-center">
                      <span className="text-4xl mb-2">📸</span>
                      <p>Capture your profile</p>
                    </div>
                  )}
                </div>
                {/* Simulated high-tech border/animation */}
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-indigo-500 animate-spin-slow"></div>
              </div>

              {!isLogin && (
                <div className="flex flex-col items-center space-y-4 w-full">
                  {!showWebcam && !image && (
                    <button
                      type="button"
                      onClick={startWebcam}
                      className="w-full max-w-xs py-3 rounded-full bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors shadow-lg"
                    >
                      Start Camera
                    </button>
                  )}
                  {showWebcam && (
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="py-2 px-4 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
                      >
                        Capture
                      </button>
                      <button
                        type="button"
                        onClick={stopWebcam}
                        className="py-2 px-4 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {image && (
                    <button
                      type="button"
                      onClick={startWebcam}
                      className="w-full max-w-xs py-3 rounded-full bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-colors"
                    >
                      Retake Photo
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: The Form */}
          <div className="md:w-1/2 p-8 md:p-12 space-y-6 flex flex-col justify-center text-gray-200">
            <div className="text-center">
              <h2 className="text-4xl font-extrabold text-white mb-2">
                {isLogin ? "Sign In" : "Sign Up"}
              </h2>
              <p className="text-gray-400">{isLogin ? "Welcome back!" : "Join the future of attendance."}</p>
            </div>

            {error && (
              <div className="bg-red-500/20 border-l-4 border-red-500 text-red-300 p-4 rounded-lg">
                <p>{error}</p>
              </div>
            )}

            <form className="space-y-4">
              {!isLogin && (
                <>
                  {/* Role selection */}
                  <div className="flex space-x-2 bg-gray-700 rounded-full p-1 transition-all">
                    <button
                      type="button"
                      onClick={() => setRole("student")}
                      className={`flex-1 py-2 rounded-full font-medium transition-colors ${role === "student" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-400 hover:bg-gray-600"}`}
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("teacher")}
                      className={`flex-1 py-2 rounded-full font-medium transition-colors ${role === "teacher" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-400 hover:bg-gray-600"}`}
                    >
                      Teacher
                    </button>
                  </div>

                  {/* Full Name & ID */}
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  />
                  {role === "student" && (
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="6-digit Student ID"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                    />
                  )}
                  {role === "teacher" && (
                    <input
                      type="text"
                      maxLength="7"
                      placeholder="Faculty ID (FAC0000)"
                      value={facultyId}
                      onChange={(e) => setFacultyId(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                    />
                  )}
                </>
              )}

              {/* Email & Password */}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              />

              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-4 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-600 transition-colors font-bold text-lg"
              >
                {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
              </button>
            </form>

            <p className="text-center text-gray-500 mt-4">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button onClick={toggleMode} className="text-indigo-400 font-semibold hover:underline transition-colors">
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroPage;