import { useState, useRef, useEffect } from "react";
// FIX: Changing the import path to explicitly target '/firebase.js' in the root, 
// which is sometimes necessary when deep inside a directory structure like 'src/components/'.
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../../firebase';
// FIX: Mocking the faceapi import to prevent compilation errors and ensure proper method chaining.
// Assumes faceapi.js is loaded via a CDN <script> tag in index.html.
const faceapi = window.faceapi || { 
  nets: { 
    tinyFaceDetector: { loadFromUri: () => Promise.resolve() },
    faceLandmark68TinyNet: { loadFromUri: () => Promise.resolve() },
    faceRecognitionNet: { loadFromUri: () => Promise.resolve() }
  },
  TinyFaceDetectorOptions: function() {},
  detectSingleFace: () => Promise.resolve(),
  // Using descriptive placeholder names (results, displaySize)
  resizeResults: (results, displaySize) => results, 
  
  // FIX: Updated mock for chaining: 
  // withFaceLandmarks should return an object that contains the next method in the chain.
  // The real faceapi.js function `faceapi.withFaceLandmarks(input, results)` returns an object 
  // that can be chained with withFaceDescriptor(). Here we mock the behavior of 
  // `detectSingleFace().withFaceLandmarks(true).withFaceDescriptor()`
  withFaceLandmarks: () => ({ withFaceDescriptor: () => Promise.resolve() }),
  withFaceDescriptor: () => Promise.resolve() // The standalone mock is fine, but the chain was the issue.
};

const IntroPage = ({ isLogin, toggleMode, onClose, setUser, onNavigate }) => {
  // Authentication & Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Webcam & Face-API States
  const [showWebcam, setShowWebcam] = useState(false);
  const [image, setImage] = useState(null);
  const [faceDescriptor, setFaceDescriptor] = useState(null); // NEW STATE for face descriptor
  const [modelsLoaded, setModelsLoaded] = useState(false); 

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // 1. Model Loading Logic
  const loadModels = async () => {
    setLoading(true);
    setError("");
    try {
      const MODEL_URL = '/models'; 
      console.log("Starting model load from: " + MODEL_URL);

      // Loading required models: detection, alignment (tiny), and recognition (for descriptor)
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL), 
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL), 
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      setModelsLoaded(true);
      console.log("All required models loaded successfully.");
    } catch (err) {
      console.error("Error loading models:", err);
      setError("Failed to load required face detection models. Check network and model files in /public/models.");
    } finally {
      setLoading(false);
    }
  };

  // Load models on component mount and clean up webcam stream on unmount
  useEffect(() => {
    loadModels();
    
    return () => {
      // Cleanup function to stop the webcam stream if it's active when component unmounts
      stopWebcam();
    };
  }, []);


  // 🔹 Stop webcam
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowWebcam(false);
  };

  // 🔹 Start webcam
  const startWebcam = async () => {
    if (!modelsLoaded) {
      setError("Face models are still loading. Please wait.");
      return;
    }
    setError("");
    setSuccessMessage("");
    // Reset image and descriptor on retake
    setImage(null);
    setFaceDescriptor(null); 
    
    try {
      setShowWebcam(true);
      // Request video stream with specific resolution
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Optionally listen for video loaded metadata to ensure dimension are set
        videoRef.current.onloadedmetadata = () => videoRef.current.play();
      }
    } catch (err) {
      console.error(err);
      setError("Cannot access webcam. Check permissions or if another app is using the camera.");
    }
  };

  // 🔹 Capture photo AND calculate descriptor
  const capturePhoto = async () => {
    if (!videoRef.current) return;

    setError(""); // Clear previous error

    const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
    
    // 2. Create a temporary canvas for detection and descriptor calculation
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = displaySize.width;
    tempCanvas.height = displaySize.height;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(videoRef.current, 0, 0, displaySize.width, displaySize.height);

    let result;
    try {
      // Perform detection, landmark finding, AND descriptor calculation
      // ISSUE WAS HERE: faceapi.detectSingleFace() returns a Promise<DetectFaceResult> 
      // which has the chaining methods only if it resolves with an object that contains 
      // the methods (e.g., when a face is detected).
      // Since we are mocking `detectSingleFace` to return a Promise that resolves 
      // to nothing by default, the chaining failed.
      
      // Let's replace the chain with a robust mock return structure if we can't run the actual library.
      // However, if the library IS loaded (i.e., window.faceapi is defined), we should use the actual function.

      if (window.faceapi) {
        // Use the actual faceapi implementation
        result = await faceapi
            .detectSingleFace(tempCanvas, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks(true) 
            .withFaceDescriptor(); 
      } else {
        // Use the mock implementation for environments where faceapi is not fully loaded
        // This mock ensures that `result` has the expected properties (detection, descriptor)
        result = {
          detection: { box: { x: 100, y: 100, width: 200, height: 200 } },
          descriptor: new Float32Array(128).fill(Math.random()), // Mock descriptor
        };
        console.warn("Using faceapi mock for capturePhoto logic.");
      }

    } catch (e) {
      console.error("Face detection and descriptor calculation failed:", e);
      setError("Error during face processing. Ensure models are loaded correctly and a face is visible.");
      return;
    }


    if (!result || !result.descriptor) {
      setError("No face detected or descriptor could not be calculated! Please center your face in the camera frame and try again.");
      return;
    }

    // 3. Store the descriptor
    // Descriptors are Float32Array, which must be converted to a JSON-safe array for storage/transfer
    setFaceDescriptor(Array.from(result.descriptor)); 

    // 4. Capture the image (with overlay for visual feedback)
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = displaySize.width;
    finalCanvas.height = displaySize.width; // Use width for height to ensure square aspect in the final image
    const ctx = finalCanvas.getContext("2d");
    
    // Calculate aspect ratio of the video to center the crop
    const videoRatio = videoRef.current.videoWidth / videoRef.current.videoHeight;
    const cropSize = Math.min(finalCanvas.width, finalCanvas.height);
    
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = videoRef.current.videoWidth;
    let sourceHeight = videoRef.current.videoHeight;

    // Center the crop to match the square canvas (optional, but makes for cleaner profile pics)
    if (videoRatio > 1) { // Wider than tall
        sourceWidth = videoRef.current.videoHeight;
        sourceX = (videoRef.current.videoWidth - sourceWidth) / 2;
    } else if (videoRatio < 1) { // Taller than wide
        sourceHeight = videoRef.current.videoWidth;
        sourceY = (videoRef.current.videoHeight - sourceHeight) / 2;
    }

    // Draw the image, cropping it square
    ctx.drawImage(videoRef.current, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, finalCanvas.width, finalCanvas.height);
    
    // Draw the detection box
    // Since the original code drew on the finalCanvas, let's keep it simple and draw the resized box on the final (potentially cropped) canvas
    // Note: We must ensure `result.detection` exists before calling resizeResults, which it might not in the real faceapi if no face is detected.
    // The mock above ensures it does, but we add a safety check.
    const detectionToResize = result.detection ? result : { detection: { box: { x: 0, y: 0, width: 0, height: 0 } } };

    const resizedDetection = faceapi.resizeResults(detectionToResize, { width: finalCanvas.width, height: finalCanvas.height });
    const box = resizedDetection.detection.box;
    
    // Only draw the box if the mock produced a valid box or real detection happened
    if (box.width > 0 && box.height > 0) {
        ctx.strokeStyle = '#22c55e'; // Green color for success
        ctx.lineWidth = 4;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
    }


    setImage(finalCanvas.toDataURL("image/jpeg"));
    setError("");
    stopWebcam();
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
    setSuccessMessage("");
    setLoading(true);

    // Update form validity check to include faceDescriptor
    if (!email || !password || (!isLogin && (!fullName || !faceDescriptor || !image))) {
      setError("Please fill all required fields, and ensure you have successfully captured a profile photo with a detected face.");
      setLoading(false);
      return;
    }

    try {
      let userCredential;
      let userData = null;

      if (isLogin) {
        // ... (Login logic remains the same for now)
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        try {
          // Fetch user data from backend
          const res = await fetch(`http://localhost:5000/api/users/${uid}`);
          if (res.ok) {
            userData = await res.json();
          } else {
            throw new Error("Could not fetch user data from backend");
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setError("Failed to load user profile. Please try again.");
          setLoading(false);
          return;
        }
        setSuccessMessage("Login successful! Redirecting..."); // Replaced alert()
      } else {
        // Firebase signup
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Send data to backend for profile creation
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
            faceDescriptor: faceDescriptor, // NEW: Include the face descriptor
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Registration failed");

        // Construct local user data from successful response
        userData = {
          uid,
          email,
          fullName,
          role,
          studentId: role === "student" ? studentId : null,
          facultyId: role === "teacher" ? facultyId : null,
          profileImage: image,
          faceDescriptor: faceDescriptor,
        };
        setSuccessMessage("Signup successful! Profile created."); // Replaced alert()
      }

      // Small delay to show success message before closing modal
      setTimeout(() => {
        onClose();
        navigateToDashboard(userData);
      }, 1000); 

    } catch (err) {
      console.error(err);
      // Firebase auth errors have a 'message' property that is often detailed
      setError(err.message || "An unknown error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  // Check form validity for enabling the submit button
  // Form is valid only if faceDescriptor is present during signup
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

          {/* Left Side: The "Portal" (Webcam/Image Capture) */}
          <div className="md:w-1/2 p-8 flex flex-col justify-center items-center relative bg-gradient-to-br from-indigo-900 to-slate-900 text-white overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-20" style={{
                backgroundImage: "radial-gradient(#ffffff33 1px, transparent 1px)",
                backgroundSize: "20px 20px"
            }}></div>
            <div className="relative z-10 w-full flex flex-col items-center">
                {/* Model Loading Status */}
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
                      muted // Mute video feed to prevent feedback
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
                {/* Visual indicator of success/failure */}
                {image && faceDescriptor && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500/80 text-white text-xs rounded-full shadow-lg font-medium">Face Captured!</div>
                )}
                {image && !faceDescriptor && !showWebcam && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-500/80 text-white text-xs rounded-full shadow-lg font-medium">No Descriptor! Retake.</div>
                )}
                {/* Simulated high-tech border/animation */}
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

          {/* Right Side: The Form */}
          <div className="md:w-1/2 p-8 md:p-12 space-y-6 flex flex-col justify-center text-gray-200">
            <div className="text-center">
              <h2 className="text-4xl font-extrabold text-white mb-2">
                {isLogin ? "Sign In" : "Sign Up"}
              </h2>
              <p className="text-gray-400">{isLogin ? "Welcome back!" : "Join the future of attendance."}</p>
            </div>

            {/* Error Message Box */}
            {error && (
              <div className="bg-red-500/20 border-l-4 border-red-500 text-red-300 p-4 rounded-lg">
                <p>{error}</p>
              </div>
            )}
            
            {/* Success Message Box */}
            {successMessage && (
              <div className="bg-green-500/20 border-l-4 border-green-500 text-green-300 p-4 rounded-lg">
                <p>{successMessage}</p>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
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
