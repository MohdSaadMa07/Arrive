import React, { useRef, useEffect, useState } from "react";
import * as faceapi from 'face-api.js';

const VerifyAttendance = ({ sessionId, closeModal, onVerificationSuccess }) => {
  const videoRef = useRef(null);
  const [verificationStatus, setVerificationStatus] = useState("Awaiting face capture...");
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Model loading logic
  useEffect(() => {
    const loadModels = async () => {
      if (!faceapi || !faceapi.nets) {
        setVerificationStatus("Error: face-api.js is not loaded. Check script tag setup.");
        return;
      }
      try {
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        setVerificationStatus("Error loading models: " + err.message);
      }
    };
    loadModels();

    // Cleanup camera on unmount
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Start camera after models are loaded
  useEffect(() => {
    if (!modelsLoaded) return;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        setVerificationStatus("Error: Camera access denied or not available.");
      }
    };
    startCamera();
  }, [modelsLoaded]);

  const handleVerification = async () => {
    setVerificationStatus("Processing facial verification...");
    if (!videoRef.current) {
      setVerificationStatus("Error: No video element available.");
      return;
    }
    if (!faceapi || !faceapi.nets) {
      setVerificationStatus("Error: face-api.js is not loaded.");
      return;
    }
    try {
      const result = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks(true)
        .withFaceDescriptor();

      if (!result || !result.descriptor) {
        setVerificationStatus("No face detected! Please center your face and try again.");
        return;
      }

      // Send to backend
      const res = await fetch("http://localhost:5000/api/users/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateDescriptor: Array.from(result.descriptor),
          sessionId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setVerificationStatus(`Verification Successful! Attendance marked for ${data.user.fullName || "this session"} 🎉`);
        onVerificationSuccess(sessionId);
      } else {
        setVerificationStatus(data.message || "Verification Failed. Please try again.");
      }
    } catch (err) {
      setVerificationStatus("Face verification failed: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8">
        <h2 className="text-3xl font-bold mb-4 text-center text-indigo-700">Face Verification</h2>
        <p className="text-gray-600 mb-6 text-center">
          Verify your identity to mark attendance for Session ID: <strong>{sessionId}</strong>
        </p>
        <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden mb-6 border-2 border-indigo-300">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        </div>
        <p className={`text-center font-semibold mb-6 ${verificationStatus.includes("Error") ? "text-red-500" : "text-gray-700"}`}>
          {verificationStatus}
        </p>
        <div className="flex justify-between space-x-4">
          <button
            onClick={closeModal}
            className="flex-1 rounded-lg bg-gray-500 text-white py-3 font-semibold shadow-md hover:bg-gray-600"
            disabled={verificationStatus.includes("Processing")}
          >
            Cancel
          </button>
          <button
            onClick={handleVerification}
            className="flex-1 rounded-lg bg-indigo-600 text-white py-3 font-semibold shadow-md hover:bg-indigo-700"
            disabled={
              verificationStatus.includes("Error") ||
              verificationStatus.includes("Processing") ||
              verificationStatus.includes("Successful") ||
              !modelsLoaded
            }
          >
            Verify Face & Mark Attendance
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyAttendance;
