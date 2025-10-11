import React, { useEffect, useState } from "react";
import UseFirebaseAuthToken from '../hooks/useFirebaseAuthToken'; // Adjust path if needed
import VerifyAttendance from "./VerifyAttendance";
import AttendanceSummary from "./AttendanceSummary";


const StudentDashboard = () => {
  const { token: authToken, loading: tokenLoading } = UseFirebaseAuthToken();

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // Hold session location for geofence
  const [currentSessionLat, setCurrentSessionLat] = useState(null);
  const [currentSessionLng, setCurrentSessionLng] = useState(null);

  const [verificationStatus, setVerificationStatus] = useState(""); // Added here


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
        const sessionsArray = Array.isArray(data) ? data : data.sessions || [];
        // Sort by createdAt descending
        const sortedSessions = sessionsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (mounted) setSessions(sortedSessions);
      } catch {
        if (mounted) setSessionsError("Failed to fetch sessions");
      } finally {
        if (mounted) setSessionsLoading(false);
      }
    };

    fetchSessions();
    return () => { mounted = false; };
  }, []);

  const handleMarkAttendanceClick = (sessionId, lat, lng) => {
    if (!authToken) {
      alert("Please sign in to verify and mark attendance.");
      return;
    }
    setCurrentSessionId(sessionId);
    setCurrentSessionLat(lat);
    setCurrentSessionLng(lng);
    setVerificationStatus(""); // Reset message
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentSessionId(null);
    setCurrentSessionLat(null);
    setCurrentSessionLng(null);
    setVerificationStatus(""); // Reset message
  };

  const submitAttendance = async (sessionId) => {
    if (!authToken) {
      alert("Authentication required to mark attendance.");
      return;
    }
    setVerificationStatus(""); // Clear previous status
    try {
      const res = await fetch("http://localhost:5000/api/attendance/mark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ sessionId }),
      });


      const data = await res.json();


      if (!res.ok) {
        if (data.error?.toLowerCase().includes("attendance can only be marked")) {
          setVerificationStatus(data.error);
          return;
        }
        throw new Error(data.error || "Failed to mark attendance");
      }


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
            {sessions.map(({ _id, subject, date, startTime, endTime, latitude, longitude }) => (
              <article
                key={_id}
                tabIndex={0}
                aria-label={`Session: ${subject} on ${new Date(date).toLocaleDateString()}`}
                className="flex flex-col justify-between rounded-lg bg-white shadow-md hover:shadow-lg focus:shadow-lg focus:outline-none transition-shadow duration-300 p-6 cursor-pointer select-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleMarkAttendanceClick(_id, latitude, longitude);
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
                  onClick={() => handleMarkAttendanceClick(_id, latitude, longitude)}
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
          sessionLatitude={currentSessionLat ?? 19.068631}
          sessionLongitude={currentSessionLng ?? 72.879134}
          closeModal={closeModal}
          onVerificationSuccess={submitAttendance}
          verificationStatus={verificationStatus}
          setVerificationStatus={setVerificationStatus}
        />
      )}
    </main>
  );
};


export default StudentDashboard;
