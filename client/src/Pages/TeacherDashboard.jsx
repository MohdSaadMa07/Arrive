import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const SUBJECTS = [
  "Database Management System",
  "Computer Networks",
  "Theoretical Computer Science",
  "Analysis of Algorithms",
  "Operating System",
  "Microprocessor",
  "DataWarehouse and mining",
  "Sofware Engineering",
];



const mapContainerStyle = {
  height: '300px',
  width: '100%',
};

const TeacherDashboard = ({ user }) => {
  const [subjectName, setSubjectName] = useState(SUBJECTS[0]);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);

  const [studentQuery, setStudentQuery] = useState("");
  const [studentData, setStudentData] = useState(null);
  const [searchError, setSearchError] = useState(null);

  const [latitude, setLatitude] = useState(19.06860769110092);
  const [longitude, setLongitude] = useState(72.879095243857);

  useEffect(() => {
    if (!user?.facultyId) return;

    let mounted = true;
    const fetchSessions = async () => {
      setLoadingSessions(true);
      setSessionsError(null);

      try {
        const res = await fetch(
          `http://localhost:5000/api/sessions?facultyId=${encodeURIComponent(user.facultyId)}`
        );
        if (!res.ok) throw new Error("Failed to fetch sessions");
        const data = await res.json();
        if (mounted) setSessions(data);
      } catch (err) {
        if (mounted) setSessionsError(err.message);
      } finally {
        if (mounted) setLoadingSessions(false);
      }
    };

    fetchSessions();
    return () => { mounted = false; };
  }, [user?.facultyId, creating]);

  const getSubjectName = (subject) => {
    if (!subject) return "Unknown Subject";
    return subject;
  };

  // Leaflet LocationPicker component inside TeacherDashboard
  const LocationPicker = ({ lat, lng, onLatChange, onLngChange }) => {
    const [markerPos, setMarkerPos] = useState([lat, lng]);

    const onDragEnd = (event) => {
      const latLng = event.target.getLatLng();
      setMarkerPos([latLng.lat, latLng.lng]);
      onLatChange(latLng.lat);
      onLngChange(latLng.lng);
    };

    return (
      <MapContainer center={markerPos} zoom={15} style={mapContainerStyle}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
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
      const newSession = {
        subject: subjectName,
        facultyId: user.facultyId,
        date,
        startTime: new Date(`${date}T${startTime}`),
        endTime: new Date(`${date}T${endTime}`),
        latitude,
        longitude,
      };
      const res = await fetch("http://localhost:5000/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSession),
      });
      if (!res.ok) throw new Error("Failed to create session");
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

  const handleSearchStudent = () => {
    setSearchError(null);
    setStudentData(null);
    if (studentQuery.trim().toLowerCase() === "john doe") {
      const dummyAttendance = {
        Math: 92,
        Physics: 85,
        History: 78,
        Chemistry: 90,
        English: 88,
      };
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
            <label className="block">
              <span className="text-gray-700">Subject</span>
              <select
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3"
              >
                {SUBJECTS.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <FloatingInput label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            <FloatingInput
              label="Start Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <FloatingInput label="End Time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />

            {/* Map location picker */}
            <LocationPicker lat={latitude} lng={longitude} onLatChange={setLatitude} onLngChange={setLongitude} />

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
                  aria-label={`Session on ${new Date(s.date).toLocaleDateString()} for ${getSubjectName(s.subject)}`}
                >
                  <div className="font-semibold text-indigo-700">{getSubjectName(s.subject)}</div>
                  <div className="text-gray-700 text-sm">
                    {new Date(s.date).toLocaleDateString()} ·{' '}
                    {new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{' '}
                    {new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Search Student */}
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
              <p className="mb-4 text-lg font-semibold text-indigo-700">
                {studentData.name} (ID: {studentData.id})
              </p>
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
