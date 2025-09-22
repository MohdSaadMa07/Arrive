import  { useState, useRef } from "react";
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../../firebase'


const IntroPage= ({ isLogin, toggleMode, onClose }) => {
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

      if (isLogin) {
        // 🔹 Firebase login
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        alert("Login successful!");
      } else {
        // 🔹 Firebase signup
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // 🔹 Send data to backend
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
        alert("Signup successful!");
      }

      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
        >
          ×
        </button>

        <div className="text-center">
          <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">🎓</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            {isLogin ? "Sign In" : "Sign Up"}
          </h2>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        <form className="space-y-4">
          {!isLogin && (
            <>
              {/* Webcam Capture */}
              <div>
                {showWebcam ? (
                  <div className="space-y-2">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-48 object-cover rounded-xl bg-gray-200"
                    />
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                      >
                        Capture Photo
                      </button>
                      <button
                        type="button"
                        onClick={stopWebcam}
                        className="flex-1 py-2 px-4 bg-gray-500 text-white rounded-xl hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : image ? (
                  <div className="space-y-2">
                    <img src={image} alt="Captured" className="w-full h-48 object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={startWebcam}
                      className="w-full py-2 px-4 bg-gray-500 text-white rounded-xl hover:bg-gray-600"
                    >
                      Retake Photo
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={startWebcam}
                    className="w-full py-3 px-4 border border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-indigo-500 hover:text-indigo-500"
                  >
                    📸 Capture Profile Photo
                  </button>
                )}
              </div>

              {/* Role selection */}
              <div className="flex space-x-2 mt-2">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex-1 py-2 rounded-xl ${role === "student" ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700"}`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole("teacher")}
                  className={`flex-1 py-2 rounded-xl ${role === "teacher" ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700"}`}
                >
                  Teacher
                </button>
              </div>

              {/* Full Name */}
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              {/* Student/Faculty ID */}
              {role === "student" && (
                <input
                  type="text"
                  maxLength="6"
                  placeholder="6-digit Student ID"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
              {role === "teacher" && (
                <input
                  type="text"
                  maxLength="7"
                  placeholder="Faculty ID (FAC0000)"
                  value={facultyId}
                  onChange={(e) => setFacultyId(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-4">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={toggleMode} className="text-indigo-600 font-semibold hover:underline">
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default IntroPage;
