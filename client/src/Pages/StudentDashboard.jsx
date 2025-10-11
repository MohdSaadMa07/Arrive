import React, { useEffect, useState } from "react";
import useFirebaseAuthToken from '../hooks/useFirebaseAuthToken'; // Adjust path as needed
import VerifyAttendance from "./VerifyAttendance";
import AttendanceSummary from "./AttendanceSummary";

const StudentDashboard = () => {
  // Destructure token and loading from custom hook
  const { token: authToken, loading: tokenLoading } = useFirebaseAuthToken();

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchSessions = async () => {
      setSessionsLoading(true);
      setSessionsError(null);
      try {
        const res = await fetch("http://localhost:5000/api/sessions");
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Failed to fetch sessions: ${res.status} ${txt}`);
        }
        const data = await res.json();
        if (mounted) setSessions(Array.isArray(data) ? data : data.sessions || []);
      } catch (err) {
        console.error("Sessions fetch error:", err);
        if (mounted) setSessionsError(err.message || "Failed to fetch sessions");
      } finally {
        if (mounted) setSessionsLoading(false);
      }
    };

    fetchSessions();
    return () => (mounted = false);
  }, []);

  const handleMarkAttendanceClick = (sessionId) => {
    if (!authToken) {
      alert("Please sign in to verify and mark attendance.");
      return;
    }
    setCurrentSessionId(sessionId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentSessionId(null);
  };

  const submitAttendance = async (sessionId) => {
    if (!authToken) {
      alert("Authentication required to mark attendance.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/attendance/mark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to mark attendance");
      }

      await res.json();
      closeModal();
      alert("Attendance verified and marked successfully! ✅");
    } catch (error) {
      alert(`Error marking attendance: ${error.message}`);
    }
  };

  if (tokenLoading) {
    return <p className="text-center text-indigo-600 text-lg">Authenticating...</p>;
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6 font-sans text-gray-900 max-w-7xl mx-auto">
      <h1 className="text-center text-4xl font-extrabold tracking-wide mb-12 text-gray-800">
        University Attendance Dashboard
      </h1>

      {sessionsLoading && <p className="text-center text-indigo-600 text-lg">Loading sessions…</p>}
      {sessionsError && <p className="text-center text-red-600 font-semibold">{sessionsError}</p>}

      {!sessionsLoading && !sessionsError && (
        <>
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
                  <time dateTime={date} className="block text-gray-600 tracking-wide font-mono text-sm">
                    {new Date(date).toLocaleDateString()}
                  </time>
                  <p className="mt-1 text-gray-700 font-medium tracking-wide">
                    {new Date(startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                    {new Date(endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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

          <section className="mt-16">
            <AttendanceSummary authToken={authToken} />
          </section>
        </>
      )}

      {isModalOpen && currentSessionId && (
        <VerifyAttendance
          sessionId={currentSessionId}
          closeModal={closeModal}
          onVerificationSuccess={submitAttendance}
          authToken={authToken}
        />
      )}
    </main>
  );
};

export default StudentDashboard;
