import React, { useState, useEffect } from "react";
import VerifyAttendance from "./VerifyAttendance";
import { getAuth } from "firebase/auth";

// Hook to get fresh Firebase ID token
const useFirebaseAuthToken = () => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          const freshToken = await user.getIdToken(true); // force refresh
          setToken(freshToken);
        } else {
          setToken(null);
        }
      } catch (error) {
        console.error("Failed to fetch Firebase ID token:", error);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, []);

  return { token, loading };
};

const StudentDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const { token: authToken, loading: tokenLoading } = useFirebaseAuthToken();

  useEffect(() => {
    if (!authToken) return; // Wait until token is available

    const fetchSessionsAndAttendance = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all sessions (public endpoint)
        const sessionsRes = await fetch("http://localhost:5000/api/sessions");
        if (!sessionsRes.ok)
          throw new Error(`Failed to fetch sessions: ${sessionsRes.statusText}`);
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData);

        // Fetch attendance summary (protected endpoint)
        const attendanceRes = await fetch(
          "http://localhost:5000/api/attendance/",
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
        if (!attendanceRes.ok) throw new Error("Failed to fetch attendance summary");
        const attendanceData = await attendanceRes.json();
        setAttendanceStats(attendanceData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionsAndAttendance();
  }, [authToken]);

  const handleMarkAttendanceClick = (sessionId) => {
    setCurrentSessionId(sessionId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentSessionId(null);
  };

  const submitAttendance = (sessionId) => {
    console.log(`Submitting attendance for session ${sessionId} after verification.`);
    alert(`Attendance verified and marked for session ${sessionId}! ✅`);
    closeModal();
  };

  if (tokenLoading) {
    return <p className="text-center text-indigo-600 text-lg">Authenticating...</p>;
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6 font-sans text-gray-900 max-w-7xl mx-auto">
      <h1 className="text-center text-4xl font-extrabold tracking-wide mb-12 text-gray-800">
        University Attendance Dashboard
      </h1>

      {loading && <p className="text-center text-indigo-600 text-lg">Loading sessions…</p>}
      {error && <p className="text-center text-red-600 font-semibold">{error}</p>}

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
                  onClick={() => handleMarkAttendanceClick(_id)}
                  aria-label={`Mark attendance for ${subject}`}
                  className="mt-6 rounded-md bg-indigo-600 text-white py-3 font-semibold shadow-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
                >
                  Mark Attendance
                </button>
              </article>
            ))}
          </section>

          {/* Attendance Stats Section */}
          <section className="mt-16 bg-white rounded-lg shadow-inner py-10 px-8">
            <h2 className="text-center text-3xl font-bold mb-10 text-gray-900 tracking-tight">
              Subject-wise Attendance
            </h2>
            <ul className="max-w-4xl mx-auto space-y-8">
              {attendanceStats.map(({ subject, lecturesAttended, totalSessions }) => {
                const percent =
                  totalSessions > 0 ? (lecturesAttended / totalSessions) * 100 : 0;
                return (
                  <li key={subject} className="flex items-center justify-between space-x-6">
                    <span className="font-semibold text-gray-800 w-40">{subject}</span>
                    <div
                      className="flex-grow bg-gray-200 rounded-full h-7 shadow-inner overflow-hidden"
                      role="progressbar"
                      aria-label={`Attendance for ${subject}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percent.toFixed(0)}
                    >
                      <div
                        className="bg-indigo-600 h-7 rounded-full transition-width duration-700 ease-in-out"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="font-semibold text-gray-900 w-12 text-right">
                      {percent.toFixed(2)}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}

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
