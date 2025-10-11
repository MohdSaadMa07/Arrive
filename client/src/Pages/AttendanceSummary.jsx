import React, { useEffect, useState } from "react";

const AttendanceSummary = ({ authToken }) => {
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authToken) return; // wait for auth token

    const fetchSummary = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("http://localhost:5000/api/attendance/summary", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch summary: ${res.statusText}`);
        }
        const data = await res.json();
        setAttendanceSummary(data);
      } catch (err) {
        setError(err.message || "Error fetching attendance summary");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [authToken]);

  if (loading) return <p className="text-center">Loading attendance summary...</p>;
  if (error) return <p className="text-center text-red-600">{error}</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Attendance Summary</h2>
      {attendanceSummary.length === 0 ? (
        <p>No attendance records found.</p>
      ) : (
        <table className="w-full text-left border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2">Subject</th>
              <th className="border border-gray-300 px-4 py-2">Total Sessions</th>
              <th className="border border-gray-300 px-4 py-2">Present</th>
              <th className="border border-gray-300 px-4 py-2">Absent</th>
              <th className="border border-gray-300 px-4 py-2">Attendance %</th>
            </tr>
          </thead>
          <tbody>
            {attendanceSummary.map(({ subject, totalSessions, presentCount, absentCount, attendancePercent }) => (
              <tr key={subject}>
                <td className="border border-gray-300 px-4 py-2">{subject}</td>
                <td className="border border-gray-300 px-4 py-2">{totalSessions}</td>
                <td className="border border-gray-300 px-4 py-2">{presentCount}</td>
                <td className="border border-gray-300 px-4 py-2">{absentCount}</td>
                <td className="border border-gray-300 px-4 py-2">{attendancePercent.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AttendanceSummary;
