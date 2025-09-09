import React, { useState, useRef } from 'react';

// AuthForm Component with Webcam
const AuthForm = ({ isLogin, toggleMode, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [image, setImage] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Start webcam
  const startWebcam = async () => {
    try {
      setShowWebcam(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error('Error accessing webcam:', err);
      setError('Could not access webcam. Please check permissions.');
    }
  };

  // Stop webcam
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowWebcam(false);
  };

  // Capture photo
  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      setImage(canvas.toDataURL('image/jpeg'));
      stopWebcam();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (isLogin) {
      if (!email || !password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }
    } else {
      if (!email || !password || !fullName || !image) {
        setError('Please fill in all fields and capture your photo');
        setLoading(false);
        return;
      }

      if (role === 'student') {
        if (!studentId) {
          setError('Please enter your Student ID');
          setLoading(false);
          return;
        }
        if (!/^\d{6}$/.test(studentId)) {
          setError('Student ID must be exactly 6 digits');
          setLoading(false);
          return;
        }
      } else if (role === 'teacher') {
        if (!facultyId) {
          setError('Please enter your Faculty ID');
          setLoading(false);
          return;
        }
        if (!/^FAC\d{4}$/.test(facultyId)) {
          setError('Faculty ID must be in format FAC0000 (FAC followed by 4 digits)');
          setLoading(false);
          return;
        }
      }
    }

    // Simulate auth
    setTimeout(() => {
      console.log(isLogin ? 'Signing in...' : 'Signing up...', { 
        email, password,
        ...(isLogin ? {} : { fullName, role, ...(role === 'student' ? { studentId } : { facultyId }), image })
      });
      setLoading(false);
      alert(isLogin ? 'Sign in successful!' : 'Sign up successful!');
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-3xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
        <div className="text-center">
          <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">🎓</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">{isLogin ? 'Sign In' : 'Sign Up'}</h2>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {!isLogin && (
            <>
              {/* Webcam Capture */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Profile Photo</label>
                {showWebcam ? (
                  <div className="space-y-4">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-48 object-cover rounded-xl bg-gray-200" />
                    <div className="flex space-x-2">
                      <button type="button" onClick={capturePhoto} className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">Capture Photo</button>
                      <button type="button" onClick={stopWebcam} className="flex-1 py-2 px-4 bg-gray-500 text-white rounded-xl hover:bg-gray-600">Cancel</button>
                    </div>
                  </div>
                ) : image ? (
                  <div className="space-y-4">
                    <img src={image} alt="Captured" className="w-full h-48 object-cover rounded-xl" />
                    <button type="button" onClick={startWebcam} className="w-full py-2 px-4 bg-gray-500 text-white rounded-xl hover:bg-gray-600">Retake Photo</button>
                  </div>
                ) : (
                  <button type="button" onClick={startWebcam} className="w-full py-3 px-4 border border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-indigo-500 hover:text-indigo-500">
                    <span className="text-lg">📸</span> Capture Profile Photo
                  </button>
                )}
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Your Role</label>
                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button type="button" onClick={() => setRole('student')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium ${role==='student'?'bg-indigo-600 text-white shadow-md':'text-gray-600 hover:text-gray-800'}`}>👨‍🎓 Student</button>
                  <button type="button" onClick={() => setRole('teacher')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium ${role==='teacher'?'bg-indigo-600 text-white shadow-md':'text-gray-600 hover:text-gray-800'}`}>👨‍🏫 Teacher</button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-400">👤</span></div>
                  <input type="text" required value={fullName} onChange={(e)=>setFullName(e.target.value)} placeholder={role==='student'?'Full Student Name':'Full Teacher Name'} className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
              </div>

              {/* Student / Faculty ID */}
              {role==='student' && <div>
                <input type="text" maxLength="6" value={studentId} onChange={(e)=>setStudentId(e.target.value.replace(/\D/g,''))} placeholder="6-digit Student ID" className="appearance-none block w-full pl-3 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>}
              {role==='teacher' && <div>
                <input type="text" maxLength="7" value={facultyId} onChange={(e)=>{
                  let val=e.target.value.toUpperCase();
                  if(!val.startsWith('FAC')) val='FAC'+val.substring(3).replace(/\D/g,'');
                  else val='FAC'+val.substring(3).replace(/\D/g,'');
                  setFacultyId(val);
                }} placeholder="Faculty ID (FAC0000)" className="appearance-none block w-full pl-3 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>}
            </>
          )}

          {/* Email */}
          <div>
            <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email address" className="appearance-none block w-full pl-3 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>

          {/* Password */}
          <div>
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" className="appearance-none block w-full pl-3 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>

          {/* Submit */}
          <div>
            <button onClick={handleSubmit} disabled={loading} className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">{loading?'Processing...':isLogin?'Sign In':'Sign Up'}</button>
          </div>

        </div>

        {/* Toggle Login/Signup */}
        <div className="text-center">
          <button onClick={toggleMode} className="text-sm font-medium text-indigo-600 hover:underline">{isLogin?'Need an account? Sign up':'Already have an account? Sign in'}</button>
        </div>
      </div>
    </div>
  );
};

// IntroPage Component
const IntroPage = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 flex items-center justify-center">
        <div className="text-center px-6 md:px-12">
          <div className="flex justify-center mb-6"><div className="bg-white p-4 rounded-full shadow-lg"><span className="text-4xl">📸</span></div></div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4">Smart Attendance System</h1>
          <p className="text-lg md:text-2xl text-gray-200 mb-6 max-w-3xl mx-auto">
            Advanced attendance tracking with 
            <span className="font-semibold text-cyan-300"> Facial Recognition</span> and 
            <span className="font-semibold text-pink-300"> Location Fencing</span> technology.
            Role-based access for 
            <span className="font-semibold text-yellow-300"> Students</span> and 
            <span className="font-semibold text-green-300"> Teachers</span>.
          </p>
          <button onClick={()=>setShowAuth(true)} className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-black rounded-xl shadow-lg hover:from-yellow-300 hover:to-orange-300 transition-all duration-300 font-semibold">Get Started 🚀</button>
        </div>
      </div>

      {showAuth && <AuthForm isLogin={isLogin} toggleMode={()=>setIsLogin(!isLogin)} onClose={()=>setShowAuth(false)} />}
    </>
  );
};

export default IntroPage;
