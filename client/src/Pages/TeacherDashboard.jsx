import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import useFirebaseAuthToken from "../hooks/useFirebaseAuthToken";

const SUBJECTS = [
  "Database Management System", "Computer Networks", "Theoretical Computer Science",
  "Analysis of Algorithms", "Operating System", "Microprocessor",
  "DataWarehouse and mining", "Sofware Engineering"
];

const mapContainerStyle = { height: '300px', width: '100%' };

const TeacherDashboard = ({ user }) => {
  const { token, loading: tokenLoading } = useFirebaseAuthToken(); // Get Firebase token
  const [subjectName, setSubjectName] = useState(SUBJECTS[0]);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentAttendance, setStudentAttendance] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const [noticeSending, setNoticeSending] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState("");

  const [latitude, setLatitude] = useState(19.06860769110092);
  const [longitude, setLongitude] = useState(72.879095243857);

  useEffect(() => {
    if (!user?.facultyId || tokenLoading || !token) return;

    let mounted = true;

    const fetchSessions = async () => {
      setLoadingSessions(true);
      setSessionsError(null);
      try {
        const res = await fetch(`http://localhost:5000/api/sessions?facultyId=${encodeURIComponent(user.facultyId)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch sessions");
        const data = await res.json();
        if (mounted) setSessions(data);
      } catch (err) {
        if (mounted) setSessionsError(err.message);
      } finally {
        if (mounted) setLoadingSessions(false);
      }
    };

    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const res = await fetch("http://localhost:5000/api/users/students", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch students");
        const data = await res.json();
        if (mounted) setStudents(data);
      } catch (err) {
        setSearchError(err.message);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchSessions();
    fetchStudents();

    return () => { mounted = false; };
  }, [user?.facultyId, creating, token, tokenLoading]);

  const getSubjectName = (subject) => subject || "Unknown Subject";

  const LocationPicker = ({ lat, lng, onLatChange, onLngChange }) => {
    const [markerPos, setMarkerPos] = React.useState([lat, lng]);
    const onDragEnd = (e) => {
      const ll = e.target.getLatLng();
      setMarkerPos([ll.lat, ll.lng]);
      onLatChange(ll.lat);
      onLngChange(ll.lng);
    };
    return (
      <MapContainer center={markerPos} zoom={15} style={mapContainerStyle}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
        <Marker position={markerPos} draggable={true} eventHandlers={{ dragend: onDragEnd }} />
      </MapContainer>
    );
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setError(null);
    if (!subjectName || !date || !startTime || !endTime) {
      setError("Please fill all fields");
      return;
    }
    setCreating(true);
    try {
      const startIST = `${date}T${startTime}`;
      const endIST = `${date}T${endTime}`;
      const newSession = {
        subject: subjectName, facultyId: user.facultyId, date,
        startTime: startIST, endTime: endIST, latitude, longitude
      };
      const res = await fetch("http://localhost:5000/api/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newSession)
      });
      if (!res.ok) throw new Error("Failed to create session");
      setDate(""); setStartTime(""); setEndTime(""); setError(null);
      alert("Session created successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const selectStudent = async (student) => {
    setSelectedStudent(student);
    setStudentAttendance(null);
    setNoticeMessage("");
    setSearchError(null);
    setLoadingAttendance(true);

    try {
      const res = await fetch(`http://localhost:5000/api/users/attendance/summary/${student.uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load attendance summary");
      const data = await res.json();
      setStudentAttendance(data);
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const sendNotice = async () => {
    if (!selectedStudent) return;
    setNoticeSending(true);
    setNoticeMessage("");
    try {
      const res = await fetch("http://localhost:5000/api/users/notice/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          studentUid: selectedStudent.uid,
          subject: "Low Attendance Notice",
          message: "Your attendance is below required threshold. Please improve."
        }),
      });
      if (!res.ok) throw new Error("Failed to send notice");
      setNoticeMessage("Notice sent successfully.");
    } catch (err) {
      setNoticeMessage(`Error sending notice: ${err.message}`);
    } finally {
      setNoticeSending(false);
    }
  };

  if (tokenLoading) {
    return <p>Loading authentication...</p>; // Show loading while token generates
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans max-w-7xl mx-auto">
      <h1 className="text-center text-4xl font-extrabold text-indigo-700 mb-12">Welcome, {user?.fullName}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Create Session */}
        <section className="bg-white rounded-xl shadow-lg p-8 flex flex-col">
          <h2 className="text-2xl font-semibold mb-6 text-indigo-600">Create New Session</h2>
          <form onSubmit={handleCreateSession} className="flex flex-col space-y-5">
            <label className="block">
              <span className="text-gray-700">Subject</span>
              <select value={subjectName} onChange={e => setSubjectName(e.target.value)} required className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3">
                {SUBJECTS.map(name => (<option key={name} value={name}>{name}</option>))}
              </select>
            </label>

            <FloatingInput label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            <FloatingInput label="Start Time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
            <FloatingInput label="End Time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />

            <LocationPicker lat={latitude} lng={longitude} onLatChange={setLatitude} onLngChange={setLongitude} />

            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button disabled={creating} type="submit" className={`py-3 rounded-lg font-semibold text-white transition-colors ${creating ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}`}>
              {creating ? "Creating..." : "Create Session"}
            </button>
          </form>
        </section>

        {/* Sessions List */}
        <section className="bg-white rounded-xl shadow-lg p-8 flex flex-col">
          <h2 className="text-2xl font-semibold mb-6 text-indigo-600">Your Sessions</h2>
          {loadingSessions ? (
            <p className="text-indigo-500 animate-pulse text-center">Loading sessions…</p>
          ) : sessionsError ? (
            <p className="text-red-600 text-center">{sessionsError}</p>
          ) : sessions.length === 0 ? (
            <p className="text-gray-500 text-center font-medium">No sessions created yet.</p>
          ) : (
            <ul className="space-y-4 max-h-[512px] overflow-y-auto">
              {sessions.map(s => (
                <li key={s._id} tabIndex={0} aria-label={`Session on ${new Date(s.date).toLocaleDateString()} for ${getSubjectName(s.subject)}`} className="p-4 border rounded-md hover:shadow-md transition cursor-default">
                  <div className="font-semibold text-indigo-700">{getSubjectName(s.subject)}</div>
                  <div className="text-gray-700 text-sm">{new Date(s.date).toLocaleDateString()} · {new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Student Search and Attendance */}
        <section className="bg-white rounded-xl shadow-lg p-8 flex flex-col">
          <h2 className="text-2xl font-semibold mb-6 text-indigo-600">Registered Students</h2>
          {loadingStudents ? (
            <p>Loading students...</p>
          ) : (
            <ul className="max-h-64 overflow-y-auto space-y-2">
              {students.map(student => (
                <li key={student.uid} className={`cursor-pointer p-2 rounded ${selectedStudent?.uid === student.uid ? 'bg-indigo-200' : 'hover:bg-indigo-100'}`} onClick={() => selectStudent(student)}>
                  {student.fullName}
                </li>
              ))}
            </ul>
          )}
          {selectedStudent && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-indigo-700">{selectedStudent.fullName}'s Attendance</h3>
              {loadingAttendance ? (
                <p>Loading attendance…</p>
              ) : studentAttendance && studentAttendance.length > 0 ? (
                <ul className="space-y-4 max-h-48 overflow-y-auto">
                  {studentAttendance.map(({ subject, totalSessions, lecturesAttended, absent, attendancePercent }) => (
                    <li key={subject} className="flex justify-between">
                      <span className="font-semibold text-indigo-700">{subject}</span>
                      <span>{lecturesAttended} / {totalSessions} ({attendancePercent.toFixed(2)}%)</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No attendance data available.</p>
              )}
              <button onClick={sendNotice} disabled={noticeSending} className="mt-4 py-2 px-6 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">
                {noticeSending ? "Sending Notice..." : "Send Low Attendance Notice"}
              </button>
              {noticeMessage && <p className={`mt-2 ${noticeMessage.toLowerCase().includes("error") ? "text-red-600" : "text-green-600"}`}>{noticeMessage}</p>}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

const FloatingInput = ({ label, type = "text", value, onChange, required }) => (
  <div className="relative">
    <input type={type} value={value} onChange={onChange} required={required} placeholder=" " className="peer w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-transparent focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none focus:ring-2 transition" />
    <label className="absolute left-4 top-3 text-gray-500 text-sm transition-all pointer-events-none
        peer-placeholder-shown:top-3 peer-placeholder-shown:left-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400
        peer-focus:top-1 peer-focus:left-3 peer-focus:text-indigo-600 peer-focus:text-sm">{label}</label>
  </div>
);

export default TeacherDashboard;
