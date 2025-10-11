import React, { useEffect, useState } from "react";

const AttendanceSummary = ({ authToken }) => {
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authToken) return;

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

  if (loading) return <p className="text-center text-indigo-600 text-lg">Loading attendance summary...</p>;
  if (error) return <p className="text-center text-red-600 font-semibold">{error}</p>;

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-10 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Attendance Summary</h2>
      {attendanceSummary.length === 0 ? (
        <p className="text-center text-gray-600">No attendance records found.</p>
      ) : (
        <table className="w-full border border-gray-300 rounded overflow-hidden">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 font-semibold">Subject</th>
              <th className="border px-4 py-2 font-semibold">Total Sessions</th>
              <th className="border px-4 py-2 font-semibold">Present</th>
              <th className="border px-4 py-2 font-semibold">Absent</th>
              <th className="border px-4 py-2 font-semibold">Attendance %</th>
            </tr>
          </thead>
          <tbody>
            {attendanceSummary.map(({ subject, totalSessions, lecturesAttended, absent, attendancePercent }, idx) => (
              <tr key={subject} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                <td className="border px-4 py-2 font-medium text-indigo-700">{subject}</td>
                <td className="border px-4 py-2 text-center">{totalSessions}</td>
                <td className="border px-4 py-2 text-center">
                  <span className={`px-2 py-1 rounded-full font-bold ${lecturesAttended ? "bg-green-200 text-green-800" : "bg-gray-200 text-gray-700"}`}>
                    {lecturesAttended}
                  </span>
                </td>
                <td className="border px-4 py-2 text-center">
                  <span className={`px-2 py-1 rounded-full font-bold ${absent ? "bg-red-200 text-red-800" : "bg-gray-200 text-gray-700"}`}>
                    {absent}
                  </span>
                </td>
                <td className="border px-4 py-2 text-center font-mono">
                  {attendancePercent !== undefined ? attendancePercent.toFixed(2) : "0.00"}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AttendanceSummary;
