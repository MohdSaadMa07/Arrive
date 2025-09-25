import React, { useState, useEffect } from 'react';

const StudentDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllSessions = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/sessions');
        const data = await res.json();
        setSessions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllSessions();
  }, []);

  if (loading) return <div>Loading sessions...</div>;

  return (
    <div>
      <h1>All Sessions</h1>
      <ul>
        {sessions.map(s => (
          <li key={s._id}>
            {s.subject} | {new Date(s.date).toLocaleDateString()} | {new Date(s.startTime).toLocaleTimeString()} - {new Date(s.endTime).toLocaleTimeString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StudentDashboard;
