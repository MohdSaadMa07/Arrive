import React, { useState, useEffect } from "react";
// Import the new component
import VerifyAttendance from "./VerifyAttendence";

const StudentDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({});
  // New state for modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("http://localhost:5000/api/sessions");
        if (!res.ok) throw new Error(`Failed to fetch sessions: ${res.statusText}`);
        const data = await res.json();
        setSessions(data);

        // Generate dummy attendance % (60-100)
        const stats = {};
        data.forEach(({ subject }) => {
          stats[subject] = Math.floor(Math.random() * 41) + 60;
        });
        setAttendanceStats(stats);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  // Updated function to open the modal
  const handleMarkAttendanceClick = (sessionId) => {
    setCurrentSessionId(sessionId);
    setIsModalOpen(true);
  };

  // Function to close the modal (used inside VerifyAttendance)
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentSessionId(null);
  };

  // Placeholder for actual attendance submission
  const submitAttendance = (sessionId) => {
    console.log(`Submitting attendance for session ${sessionId} after verification.`);
    alert(`Attendance verified and marked for session ${sessionId}! ✅`);
    closeModal(); // Close the modal after submission (or success)
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6 font-sans text-gray-900 max-w-7xl mx-auto">
      <h1 className="text-center text-4xl font-extrabold tracking-wide mb-12 text-gray-800">
        University Attendance Dashboard
      </h1>

      {loading && (
        <p className="text-center text-indigo-600 text-lg">Loading sessions…</p>
      )}
      {error && (
        <p className="text-center text-red-600 font-semibold">{error}</p>
      )}

      {!loading && !error && (
        <>
          {/* Sessions Grid */}
          <section className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {sessions.map(({ _id, subject, date, startTime, endTime }) => (
              <article
                key={_id}
                tabIndex={0}
                aria-label={`Session: ${subject} on ${new Date(date).toLocaleDateString()}`}
                className="flex flex-col justify-between rounded-lg bg-white shadow-md hover:shadow-lg focus:shadow-lg focus:outline-none transition-shadow duration-300 p-6 cursor-pointer select-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleMarkAttendanceClick(_id);
                }}
              >
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">{subject}</h2>
                  <time
                    dateTime={date}
                    className="block text-gray-600 tracking-wide font-mono text-sm"
                  >
                    {new Date(date).toLocaleDateString()}
                  </time>
                  <p className="mt-1 text-gray-700 font-medium tracking-wide">
                    {new Date(startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(endTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <button
                  // Call the new handler
                  onClick={() => handleMarkAttendanceClick(_id)}
                  aria-label={`Mark attendance for ${subject}`}
                  className="mt-6 rounded-md bg-indigo-600 text-white py-3 font-semibold shadow-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
                >
                  Mark Attendance
                </button>
              </article>
            ))}
          </section>

          {/* --- */}

          {/* Attendance Stats Section */}
          <section className="mt-16 bg-white rounded-lg shadow-inner py-10 px-8">
            <h2 className="text-center text-3xl font-bold mb-10 text-gray-900 tracking-tight">
              Subject-wise Attendance
            </h2>
            <ul className="max-w-4xl mx-auto space-y-8">
              {Object.entries(attendanceStats).map(([subject, percent]) => (
                <li
                  key={subject}
                  className="flex items-center justify-between space-x-6"
                >
                  <span className="font-semibold text-gray-800 w-40">{subject}</span>
                  <div className="flex-grow bg-gray-200 rounded-full h-7 shadow-inner overflow-hidden">
                    <div
                      className="bg-indigo-600 h-7 rounded-full transition-width duration-700 ease-in-out"
                      style={{ width: `${percent}%` }}
                      role="progressbar"
                      aria-label={`Attendance for ${subject}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percent}
                    />
                  </div>
                  <span className="font-semibold text-gray-900 w-12 text-right">
                    {percent}%
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
      
      {/* Verification Modal Component */}
      {isModalOpen && currentSessionId && (
        <VerifyAttendance
          sessionId={currentSessionId}
          closeModal={closeModal}
          onVerificationSuccess={submitAttendance}
        />
      )}
    </main>
  );
};

export default StudentDashboard;