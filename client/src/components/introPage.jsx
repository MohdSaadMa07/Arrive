import { useState, useRef, useEffect } from "react";
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../../firebase';
import * as faceapi from 'face-api.js';

const IntroPage = ({ isLogin, toggleMode, onClose, setUser, onNavigate }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showWebcam, setShowWebcam] = useState(false);
  const [image, setImage] = useState(null);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Load face-api.js models from /models directory
  const loadModels = async () => {
    setLoading(true);
    setError("");
    try {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      setModelsLoaded(true);
    } catch (err) {
      setError("Failed to load models: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
    return () => stopWebcam();
    // eslint-disable-next-line
  }, []);

  // Stop webcam stream
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowWebcam(false);
  };

  // Start webcam stream
  const startWebcam = async () => {
    if (!modelsLoaded) {
      setError("Face models are still loading. Please wait.");
      return;
    }
    setError("");
    setSuccessMessage("");
    setImage(null);
    setFaceDescriptor(null);
    try {
      setShowWebcam(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => videoRef.current.play();
      }
    } catch (err) {
      setError("Cannot access webcam. Check permissions or if another app is using the camera.");
    }
  };

  // Capture photo and calculate face descriptor
  const capturePhoto = async () => {
    if (!videoRef.current) return;
    setError(""); // Clear previous error

    const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };

    // Draw current video frame to temp canvas
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = displaySize.width;
    tempCanvas.height = displaySize.height;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(videoRef.current, 0, 0, displaySize.width, displaySize.height);

    let result;
    try {
      result = await faceapi
        .detectSingleFace(tempCanvas, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks(true)
        .withFaceDescriptor();
    } catch (e) {
      setError("Face processing failed: " + e.message);
      return;
    }

    if (!result || !result.descriptor) {
      setError("No face detected! Please center your face in the camera frame and try again.");
      return;
    }

    setFaceDescriptor(Array.from(result.descriptor));

    // -- IMAGE CROPPING/CANVAS LOGIC --
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = displaySize.width;
    finalCanvas.height = displaySize.width; // Ensure square
    const ctx = finalCanvas.getContext("2d");
    const videoRatio = videoRef.current.videoWidth / videoRef.current.videoHeight;
    let sourceX = 0, sourceY = 0, sourceWidth = videoRef.current.videoWidth, sourceHeight = videoRef.current.videoHeight;
    if (videoRatio > 1) {
      sourceWidth = videoRef.current.videoHeight;
      sourceX = (videoRef.current.videoWidth - sourceWidth) / 2;
    } else if (videoRatio < 1) {
      sourceHeight = videoRef.current.videoWidth;
      sourceY = (videoRef.current.videoHeight - sourceHeight) / 2;
    }
    ctx.drawImage(videoRef.current, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, finalCanvas.width, finalCanvas.height);

    // Draw detection box if available
    const detectionToResize = result.detection ? result : { detection: { box: { x: 0, y: 0, width: 0, height: 0 } } };
    const resizedDetection = faceapi.resizeResults(detectionToResize, { width: finalCanvas.width, height: finalCanvas.height });
    const box = resizedDetection.detection.box;
    if (box.width > 0 && box.height > 0) {
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 4;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
    }

    setImage(finalCanvas.toDataURL("image/jpeg"));
    setError("");
    stopWebcam();
  };

  // Submit (login/signup)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    if (!email || !password || (!isLogin && (!fullName || !faceDescriptor || !image))) {
      setError("Please fill all the required fields and capture your face photo");
      setLoading(false);
      return;
    }

    try {
      let userCredential;
      let userData = null;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        const token = await userCredential.user.getIdToken();
        const res = await fetch(`http://localhost:5000/api/users/${uid}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          const errorResponse = await res.json();
          throw new Error(errorResponse.message || "Could not fetch user profile");
        }
        userData = await res.json();
        setSuccessMessage("Login successful! Redirecting...");
      } else {
        // Sign up flow
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        const res = await fetch("http://localhost:5000/api/users/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid, email, fullName, role,
            studentId: role === "student" ? studentId : null,
            facultyId: role === "teacher" ? facultyId : null,
            profileImage: image,
            faceDescriptor,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Registration failed");
        userData = {
          uid, email, fullName, role,
          studentId: role === "student" ? studentId : null,
          facultyId: role === "teacher" ? facultyId : null,
          profileImage: image,
          faceDescriptor,
        };
        setSuccessMessage("Signup successful! Profile created.");
      }
      setUser(userData);
      setTimeout(() => {
        onClose();
        onNavigate(`/${userData.role}`);
      }, 1000);

    } catch (err) {
      setError(err.message || "Authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Form validity
  const isFormValid = isLogin || (fullName && email && password && (role === "student" ? studentId : facultyId) && image && faceDescriptor);

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
          {/* Left: Webcam portal */}
          <div className="md:w-1/2 p-8 flex flex-col justify-center items-center relative bg-gradient-to-br from-indigo-900 to-slate-900 text-white overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-20" style={{
              backgroundImage: "radial-gradient(#ffffff33 1px, transparent 1px)",
              backgroundSize: "20px 20px"
            }}></div>
            <div className="relative z-10 w-full flex flex-col items-center">
              {!modelsLoaded && (
                <div className="text-center mb-4 p-2 rounded-lg bg-yellow-600/30 text-yellow-300 border border-yellow-500">
                  {loading ? "Loading Face-API Models..." : "Initializing..."}
                </div>
              )}
              <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full border-2 border-indigo-400 p-1 flex items-center justify-center mb-6">
                <div className="w-full h-full rounded-full overflow-hidden">
                  {showWebcam ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : image ? (
                    <img src={image} alt="Captured Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full bg-gray-700 text-gray-400 text-center">
                      <span className="text-4xl mb-2">📸</span>
                      <p>Capture your profile</p>
                    </div>
                  )}
                </div>
                {image && faceDescriptor && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500/80 text-white text-xs rounded-full shadow-lg font-medium">Face Captured!</div>
                )}
                {image && !faceDescriptor && !showWebcam && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-500/80 text-white text-xs rounded-full shadow-lg font-medium">No Descriptor! Retake.</div>
                )}
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-indigo-500 animate-spin-slow"></div>
              </div>
              {!isLogin && (
                <div className="flex flex-col items-center space-y-4 w-full">
                  {!showWebcam && (!image || !faceDescriptor) && (
                    <button
                      type="button"
                      onClick={startWebcam}
                      disabled={!modelsLoaded}
                      className="w-full max-w-xs py-3 rounded-full bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors shadow-lg disabled:bg-gray-600"
                    >
                      {modelsLoaded ? "Start Camera" : "Loading Models..."}
                    </button>
                  )}
                  {showWebcam && (
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="py-2 px-4 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
                      >
                        Capture & Extract Descriptor
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
                  {image && faceDescriptor && (
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
          {/* Form */}
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
            {successMessage && (
              <div className="bg-green-500/20 border-l-4 border-green-500 text-green-300 p-4 rounded-lg">
                <p>{successMessage}</p>
              </div>
            )}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {!isLogin && (
                <>
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
                disabled={loading || !modelsLoaded || !isFormValid}
                className="w-full py-4 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-600 transition-colors font-bold text-lg"
              >
                {loading ? "Processing..." :
                  !modelsLoaded ? "Waiting for Models..." :
                  isLogin ? "Sign In" : "Sign Up"}
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
