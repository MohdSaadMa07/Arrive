import React, { useState, useEffect } from 'react';

const TeacherDashboard = ({ user }) => {
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user?.facultyId) return;
    const fetchMySessions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/sessions`);
        const data = await res.json();
        setSessions(data.filter(s => s.facultyId === user.facultyId));
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };
    fetchMySessions();
  }, [user?.facultyId]);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!subject || !date || !startTime || !endTime) {
      setError('Please fill all fields');
      return;
    }
    const newSession = {
      subject,
      facultyId: user.facultyId,
      date,
      startTime: new Date(`${date}T${startTime}`),
      endTime: new Date(`${date}T${endTime}`)
    };
    try {
      setCreating(true);
      const res = await fetch('http://localhost:5000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSession)
      });
      if (!res.ok) throw new Error('Failed to create session');
      const created = await res.json();
      setSessions((prev) => [...prev, created]);
      setSubject('');
      setDate('');
      setStartTime('');
      setEndTime('');
      setError(null);
    } catch (err) {
      setError(err.message || 'Error creating session');
    } finally {
      setCreating(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className='p-6'>
      <h1>Welcome, {user.fullName}</h1>
      <form onSubmit={handleCreateSession}>
        <input placeholder='Subject' value={subject} onChange={e => setSubject(e.target.value)} required />
        <input type='date' value={date} onChange={e => setDate(e.target.value)} required />
        <input type='time' value={startTime} onChange={e => setStartTime(e.target.value)} required />
        <input type='time' value={endTime} onChange={e => setEndTime(e.target.value)} required />
        <button disabled={creating} type='submit'>{creating ? 'Creating...' : 'Create Session'}</button>
      </form>
      <h2>Your Sessions</h2>
      {loading ? <p>Loading your sessions...</p> : (
        <ul>
          {sessions.map(s => (
            <li key={s._id}>
              {s.subject} — {new Date(s.date).toLocaleDateString()} ({new Date(s.startTime).toLocaleTimeString()} - {new Date(s.endTime).toLocaleTimeString()})
            </li>
          ))}
        </ul>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default TeacherDashboard;
