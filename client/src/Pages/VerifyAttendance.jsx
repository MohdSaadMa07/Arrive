import React, { useRef, useEffect, useState } from "react";

const VerifyAttendance = ({ sessionId, closeModal, onVerificationSuccess }) => {
  const videoRef = useRef(null);
  const [verificationStatus, setVerificationStatus] = useState("Awaiting face capture...");

  useEffect(() => {
    // Attempt to access the user's camera
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera: ", err);
        setVerificationStatus("Error: Camera access denied or not available. 🚫");
      }
    };

    startCamera();

    // Cleanup function to stop the camera when the component unmounts
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const handleVerification = () => {
    setVerificationStatus("Processing facial verification... 🤖");

    // --- Placeholder for actual Facial Recognition Logic ---
    // In a real application, you'd send the captured image/video to a backend
    // service for processing.
    setTimeout(() => {
      // Simulate successful verification
      const success = Math.random() > 0.3; // 70% chance of success

      if (success) {
        setVerificationStatus("Verification Successful! 🎉");
        // Pass the sessionId back to the parent to mark attendance
        onVerificationSuccess(sessionId); 
      } else {
        setVerificationStatus("Verification Failed. Please try again. 😔");
        // You might keep the modal open or prompt a retry
      }
    }, 3000); // Wait 3 seconds to simulate processing time
  };

  return (
    // Modal Overlay
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8 transform transition-all scale-100 animate-fade-in">
        <h2 className="text-3xl font-bold mb-4 text-center text-indigo-700">Face Verification</h2>
        <p className="text-gray-600 mb-6 text-center">
          Verify your identity to mark attendance for Session ID: <strong className="font-mono">{sessionId}</strong>.
        </p>

        {/* Video Feed Area */}
        <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden mb-6 border-2 border-indigo-300">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]" // mirror effect
          />
        </div>

        <p className={`text-center font-semibold mb-6 ${verificationStatus.includes("Error") ? 'text-red-500' : 'text-gray-700'}`}>
          {verificationStatus}
        </p>

        {/* Action Buttons */}
        <div className="flex justify-between space-x-4">
          <button
            onClick={closeModal}
            className="flex-1 rounded-lg bg-gray-500 text-white py-3 font-semibold shadow-md hover:bg-gray-600 focus:ring-2 focus:ring-gray-400 focus:outline-none transition"
            disabled={verificationStatus.includes("Processing")}
          >
            Cancel
          </button>
          <button
            onClick={handleVerification}
            className="flex-1 rounded-lg bg-indigo-600 text-white py-3 font-semibold shadow-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
            disabled={verificationStatus.includes("Error") || verificationStatus.includes("Processing") || verificationStatus.includes("Successful")}
          >
            Verify Face & Mark Attendance
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyAttendance;