import React, { useState } from 'react';

// AuthForm Component
const AuthForm = ({ isLogin, toggleMode, onClose }) => {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [fullName, setFullName] = useState('');
 const [studentId, setStudentId] = useState('');
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);

 const handleSubmit = (e) => {
   e.preventDefault();
   setError('');
   setLoading(true);
   
   // Validate required fields
   if (isLogin) {
     if (!email || !password) {
       setError('Please fill in all fields');
       setLoading(false);
       return;
     }
   } else {
     // Sign up validation
     if (!email || !password || !fullName || !studentId) {
       setError('Please fill in all fields');
       setLoading(false);
       return;
     }
     
     // Validate student ID (6 digits)
     if (!/^\d{6}$/.test(studentId)) {
       setError('Student ID must be exactly 6 digits');
       setLoading(false);
       return;
     }
   }
   
   // Simulate authentication process
   setTimeout(() => {
     console.log(isLogin ? 'Signing in...' : 'Signing up...', { 
       email, 
       password, 
       ...(isLogin ? {} : { fullName, studentId })
     });
     setLoading(false);
     alert(isLogin ? 'Sign in successful!' : 'Sign up successful!');
   }, 1000);
 };

 return (
   <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
     <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-3xl shadow-2xl relative">
       {/* Close Button */}
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
           {isLogin ? 'Sign In' : 'Sign Up'}
         </h2>
       </div>
       
       {error && (
         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
           <p>{error}</p>
         </div>
       )}
       
       <div className="space-y-6">
         {!isLogin && (
           <div>
             <label htmlFor="full-name" className="sr-only">Full Name</label>
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <span className="text-gray-400">👤</span>
               </div>
               <input
                 id="full-name"
                 name="fullName"
                 type="text"
                 required
                 value={fullName}
                 onChange={(e) => setFullName(e.target.value)}
                 className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                 placeholder="Full Student Name"
               />
             </div>
           </div>
         )}

         {!isLogin && (
           <div>
             <label htmlFor="student-id" className="sr-only">Student ID</label>
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <span className="text-gray-400">🎓</span>
               </div>
               <input
                 id="student-id"
                 name="studentId"
                 type="text"
                 maxLength="6"
                 pattern="[0-9]{6}"
                 required
                 value={studentId}
                 onChange={(e) => {
                   const value = e.target.value.replace(/\D/g, ''); // Only digits
                   setStudentId(value);
                 }}
                 className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                 placeholder="6-digit Student ID"
               />
             </div>
           </div>
         )}

         <div>
           <label htmlFor="email-address" className="sr-only">Email address</label>
           <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <span className="text-gray-400">@</span>
             </div>
             <input
               id="email-address"
               name="email"
               type="email"
               autoComplete="email"
               required
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
               placeholder="Email address"
             />
           </div>
         </div>
         
         <div>
           <label htmlFor="password" className="sr-only">Password</label>
           <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <span className="text-gray-400">🔒</span>
             </div>
             <input
               id="password"
               name="password"
               type="password"
               autoComplete={isLogin ? 'current-password' : 'new-password'}
               required
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
               placeholder="Password"
             />
           </div>
         </div>
         
         <div>
           <button
             onClick={handleSubmit}
             disabled={loading}
             className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
           >
             <span className="absolute left-0 inset-y-0 flex items-center pl-3">
               <span className="text-indigo-500 group-hover:text-indigo-400">🔒</span>
             </span>
             {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
           </button>
         </div>
       </div>
       
       <div className="text-center">
         <button
           onClick={toggleMode}
           className="text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:underline transition-colors duration-200"
         >
           {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
         </button>
       </div>
     </div>
   </div>
 );
};

// Main IntroPage Component
const IntroPage = () => {
 const [showAuth, setShowAuth] = useState(false);
 const [isLogin, setIsLogin] = useState(true);

 const handleGetStarted = () => {
   setShowAuth(true);
 };

 const handleCloseAuth = () => {
   setShowAuth(false);
 };

 const toggleAuthMode = () => {
   setIsLogin(!isLogin);
 };

 return (
   <>
     <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 flex items-center justify-center">
       <div className="text-center px-6 md:px-12">
         {/* Logo / Icon */}
         <div className="flex justify-center mb-6">
           <div className="bg-white p-4 rounded-full shadow-lg">
             <span className="text-4xl">📸</span>
           </div>
         </div>

         {/* Heading */}
         <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4">
           Smart Attendance System
         </h1>

         {/* Subheading */}
         <p className="text-lg md:text-2xl text-gray-200 mb-6 max-w-3xl mx-auto">
           Advanced attendance tracking with 
           <span className="font-semibold text-cyan-300"> Facial Recognition</span> and 
           <span className="font-semibold text-pink-300"> Location Fencing</span> technology.
           Role-based access for 
           <span className="font-semibold text-yellow-300"> Students</span> and 
           <span className="font-semibold text-green-300"> Teachers</span>.
         </p>

         {/* Feature highlights */}
         <div className="flex flex-wrap justify-center gap-4 mb-8 max-w-4xl mx-auto">
           <div className="bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-full border border-white border-opacity-30">
             <span className="text-white font-medium">🔒 Secure & Private</span>
           </div>
           <div className="bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-full border border-white border-opacity-30">
             <span className="text-white font-medium">📍 Location Verified</span>
           </div>
           <div className="bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-full border border-white border-opacity-30">
             <span className="text-white font-medium">⚡ Real-time Tracking</span>
           </div>
           <div className="bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-full border border-white border-opacity-30">
             <span className="text-white font-medium">📊 Smart Analytics</span>
           </div>
         </div>

         {/* CTA Buttons */}
         <div className="flex flex-col sm:flex-row justify-center gap-4">
           <button
             onClick={handleGetStarted}
             className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-black rounded-xl shadow-lg hover:from-yellow-300 hover:to-orange-300 transition-all duration-300 font-semibold transform hover:scale-105 cursor-pointer"
           >
             Get Started 🚀
           </button>

         </div>

         {/* Additional info */}
         <p className="text-sm text-gray-300 mt-8 max-w-2xl mx-auto">
           Ensure attendance is marked only from designated locations with our geofencing technology.
           No more proxy attendance - authenticity guaranteed.
         </p>
       </div>
     </div>

     {/* Auth Modal */}
     {showAuth && (
       <AuthForm 
         isLogin={isLogin} 
         toggleMode={toggleAuthMode} 
         onClose={handleCloseAuth}
       />
     )}
   </>
 );
};

export default IntroPage;