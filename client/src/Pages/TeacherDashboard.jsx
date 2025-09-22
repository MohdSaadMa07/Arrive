import React, { useState, useEffect } from "react";

const TeacherDashboard = ({ user }) => {  // Changed from 'teacher' to 'user'
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user?.facultyId) return;

    const fetchSessions = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5000/api/sessions/teacher/${user.facultyId}`);
        if (!res.ok) throw new Error("Failed to fetch sessions");
        const data = await res.json();
        setSessions(data);
        setError(null);
      } catch (err) {
        setError(err.message || "Error fetching sessions");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user?.facultyId]);

  const handleCreateSession = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!subject.trim() || !date || !startTime || !endTime) {
      setError("Please fill all fields");
      return;
    }

    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);

    if (startDateTime >= endDateTime) {
      setError("End time must be after start time");
      return;
    }

    const newSession = {
      subject: subject.trim(),
      facultyId: user.facultyId,
      date: new Date(date),
      startTime: startDateTime,
      endTime: endDateTime,
    };

    try {
      setCreating(true);
      setError(null);
      const res = await fetch("http://localhost:5000/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSession),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create session");
      }
      const createdSession = await res.json();
      setSessions((prev) => [...prev, createdSession]);
      // Clear form inputs
      setSubject("");
      setDate("");
      setStartTime("");
      setEndTime("");
    } catch (err) {
      setError(err.message || "Error creating session");
    } finally {
      setCreating(false);
    }
  };

  // Debug logging to see what data we're getting
  console.log("User data in TeacherDashboard:", user);

  if (!user) return <div>Loading teacher data...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">Welcome, {user.fullName}</h1>

      <section className="mb-6 p-4 bg-white rounded-xl shadow max-w-md">
        <h2 className="text-xl font-semibold mb-4">Schedule a Class</h2>
        <form onSubmit={handleCreateSession} className="space-y-4">
          <input
            type="text"
            placeholder="Subject"
            className="w-full px-4 py-2 border rounded-xl"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={creating}
            required
          />
          <input
            type="date"
            className="w-full px-4 py-2 border rounded-xl"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={creating}
            required
          />
          <input
            type="time"
            className="w-full px-4 py-2 border rounded-xl"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            disabled={creating}
            required
          />
          <input
            type="time"
            className="w-full px-4 py-2 border rounded-xl"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={creating}
            required
          />
          {error && <p className="text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={creating}
            className="w-full bg-indigo-600 text-white py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-60"
          >
            {creating ? "Creating..." : "Create Session"}
          </button>
        </form>
      </section>

      <section className="p-4 bg-white rounded-xl shadow max-w-3xl">
        <h2 className="text-xl font-semibold mb-4">Your Sessions</h2>
        {loading ? (
          <p>Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p>No sessions scheduled yet.</p>
        ) : (
          <ul className="space-y-3">
            {sessions.map((session) => (
              <li
                key={session._id}
                className="border p-3 rounded-xl bg-gray-50 flex justify-between items-center"
              >
                <div>
                  <strong>{session.subject}</strong>
                  <div className="text-gray-600 text-sm">
                    {new Date(session.date).toLocaleDateString()} |{" "}
                    {new Date(session.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(session.endTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default TeacherDashboard;