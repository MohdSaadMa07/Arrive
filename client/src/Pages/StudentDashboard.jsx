import React, { useEffect, useState } from "react";

const StudentDashboard = ({ student }) => {
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student?.uid) return;

    const fetchData = async () => {
      try {
        const [sessionsRes, attendanceRes] = await Promise.all([
          fetch(`http://localhost:5000/api/sessions/upcoming?studentUid=${student.uid}`),
          fetch(`http://localhost:5000/api/attendance/history?studentUid=${student.uid}`),
        ]);
        const sessionsData = await sessionsRes.json();
        const attendanceData = await attendanceRes.json();
        setUpcomingClasses(sessionsData);
        setAttendanceHistory(attendanceData);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [student?.uid]);

  if (!student) return <div>Loading student data...</div>;
  if (loading) return <div>Loading dashboard data...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Hello, {student.fullName}</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Upcoming Classes</h2>
        {upcomingClasses.length === 0 ? (
          <p>No upcoming classes scheduled.</p>
        ) : (
          <ul>
            {upcomingClasses.map((session) => (
              <li key={session._id} className="mb-2">
                <strong>{session.subject}</strong> | {new Date(session.date).toLocaleDateString()}{" "}
                {new Date(session.startTime).toLocaleTimeString()} - {new Date(session.endTime).toLocaleTimeString()}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Previous Attendance</h2>
        {attendanceHistory.length === 0 ? (
          <p>No attendance records found.</p>
        ) : (
          <ul>
            {attendanceHistory.map((record) => (
              <li key={record._id} className="mb-2">
                <strong>{record.session.subject}</strong> - {record.status.toUpperCase()} on{" "}
                {new Date(record.session.date).toLocaleDateString()}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default StudentDashboard;
