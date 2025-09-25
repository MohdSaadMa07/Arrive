import React, { useState, useEffect } from "react";

const dummyAttendance = {
  Math: 92,
  Physics: 85,
  History: 78,
  Chemistry: 90,
  English: 88,
};

const TeacherDashboard = ({ user }) => {
  // Session creation form state
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  // Sessions list state
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);

  // Student search and attendance summary state
  const [studentQuery, setStudentQuery] = useState("");
  const [studentData, setStudentData] = useState(null);
  const [searchError, setSearchError] = useState(null);

  // Fetch sessions created by this teacher on component mount and after creating session
  useEffect(() => {
    if (!user?.facultyId) return;
    const fetchSessions = async () => {
      setLoadingSessions(true);
      setSessionsError(null);
      try {
        const res = await fetch("http://localhost:5000/api/sessions");
        if (!res.ok) throw new Error("Failed to fetch sessions");
        const data = await res.json();
        const filtered = data.filter((s) => s.facultyId === user.facultyId);
        setSessions(filtered);
      } catch (err) {
        setSessionsError(err.message);
      } finally {
        setLoadingSessions(false);
      }
    };
    fetchSessions();
  }, [user?.facultyId, creating]); // refetch on session creation

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setError(null);
    if (!subject || !date || !startTime || !endTime) {
      setError("Please fill all fields");
      return;
    }
    setCreating(true);
    try {
      const newSession = {
        subject,
        facultyId: user.facultyId,
        date,
        startTime: new Date(`${date}T${startTime}`),
        endTime: new Date(`${date}T${endTime}`),
      };
      const res = await fetch("http://localhost:5000/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSession),
      });
      if (!res.ok) throw new Error("Failed to create session");
      // Reset form
      setSubject("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setError(null);
      alert("Session created successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  // Dummy search handler for demo
  const handleSearchStudent = () => {
    setSearchError(null);
    setStudentData(null);
    if (studentQuery.trim().toLowerCase() === "john doe") {
      setStudentData({ id: "12345", name: "John Doe", attendance: dummyAttendance });
    } else if (studentQuery.trim() === "") {
      setSearchError("Please enter a student name or ID");
    } else {
      setSearchError("Student not found");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans max-w-7xl mx-auto">
      <h1 className="text-center text-4xl font-extrabold text-indigo-700 mb-12">
        Welcome, {user?.fullName}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Create Session */}
        <section className="bg-white rounded-xl shadow-lg p-8 flex flex-col">
          <h2 className="text-2xl font-semibold mb-6 text-indigo-600">Create New Session</h2>
          <form onSubmit={handleCreateSession} className="flex flex-col space-y-5">
            <FloatingInput
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
            <FloatingInput
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <FloatingInput
              label="Start Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <FloatingInput
              label="End Time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              disabled={creating}
              type="submit"
              className={`py-3 rounded-lg font-semibold text-white transition-colors ${
                creating ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {creating ? "Creating..." : "Create Session"}
            </button>
          </form>
        </section>

        {/* Sessions List */}
        <section className="bg-white rounded-xl shadow-lg p-8 flex flex-col">
          <h2 className="text-2xl font-semibold mb-6 text-indigo-600">Your Sessions</h2>
          {loadingSessions ? (
            <p className="text-indigo-500 animate-pulse text-center">Loading sessions...</p>
          ) : sessionsError ? (
            <p className="text-red-600 text-center">{sessionsError}</p>
          ) : sessions.length === 0 ? (
            <p className="text-gray-500 text-center font-medium">No sessions created yet.</p>
          ) : (
            <ul className="space-y-4 max-h-[512px] overflow-y-auto">
              {sessions.map((s) => (
                <li
                  key={s._id}
                  className="p-4 border rounded-md hover:shadow-md transition cursor-default"
                  tabIndex={0}
                  aria-label={`Session on ${new Date(s.date).toLocaleDateString()} for ${s.subject}`}
                >
                  <div className="font-semibold text-indigo-700">{s.subject}</div>
                  <div className="text-gray-700 text-sm">
                    {new Date(s.date).toLocaleDateString()} ·{" "}
                    {new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                    {new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Student Search and Attendance */}
        <section className="bg-white rounded-xl shadow-lg p-8 flex flex-col">
          <h2 className="text-2xl font-semibold mb-6 text-indigo-600">Search Student</h2>
          <input
            type="text"
            placeholder="Enter student name or ID"
            value={studentQuery}
            onChange={(e) => setStudentQuery(e.target.value)}
            className="mb-4 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Search student"
          />
          <button
            onClick={handleSearchStudent}
            className="py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
          >
            Search
          </button>
          {searchError && <p className="text-red-600 mt-3">{searchError}</p>}
          {studentData && (
            <div className="mt-6">
              <p className="mb-4 text-lg font-semibold text-indigo-700">{studentData.name} (ID: {studentData.id})</p>
              <ul className="space-y-4 max-h-72 overflow-y-auto">
                {Object.entries(studentData.attendance).map(([subject, percent]) => (
                  <li key={subject} className="flex items-center space-x-4">
                    <span className="font-semibold text-indigo-700 w-28">{subject}</span>
                    <div className="flex-grow bg-indigo-100 rounded-full h-6 shadow-inner overflow-hidden">
                      <div
                        className="h-6 bg-indigo-600 rounded-full transition-all duration-700 ease-in-out"
                        style={{ width: `${percent}%` }}
                        role="progressbar"
                        aria-label={`Attendance for ${subject}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={percent}
                      />
                    </div>
                    <span className="w-12 text-right font-semibold text-indigo-700">{percent}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

const FloatingInput = ({ label, type = "text", value, onChange, required }) => (
  <div className="relative">
    <input
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      placeholder=" "
      className="peer w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-transparent focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none focus:ring-2 transition"
    />
    <label
      className="absolute left-4 top-3 text-gray-500 text-sm transition-all pointer-events-none 
        peer-placeholder-shown:top-3 peer-placeholder-shown:left-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 
        peer-focus:top-1 peer-focus:left-3 peer-focus:text-indigo-600 peer-focus:text-sm"
    >
      {label}
    </label>
  </div>
);

export default TeacherDashboard;
