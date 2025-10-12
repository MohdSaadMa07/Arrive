import React, { useEffect, useState } from 'react';

const AttendanceDashboard = ({ sessionId }) => {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sessionId) return;

    const fetchAttendance = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/attendance/session/${sessionId}`);
        if (!response.ok) throw new Error('Failed to fetch attendance');
        const data = await response.json();
        setAttendees(data.attendees);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();

    // Optional: Poll for updates every 10 seconds for near-real-time updates
    const interval = setInterval(fetchAttendance, 10000);
    return () => clearInterval(interval);
  }, [sessionId]);

  if (!sessionId) return <p>Please select a session.</p>;
  if (loading) return <p>Loading attendance...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Attendance for Session {sessionId}</h2>
      <ul>
        {attendees.map((student) => (
          <li key={student.uid}>
            {student.fullName} (ID: {student.studentId}) - Marked at: {new Date(student.markedAt).toLocaleTimeString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AttendanceDashboard;
