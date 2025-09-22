import React, { useState, useEffect } from "react";
import TeacherDashboard from "./TeacherDashboard";
import StudentDashboard from "./StudentDashboard";
import { auth } from "../../firebase"; // assuming you keep Firebase auth

const Dashboard = () => {
  const [user, setUser] = useState(null); // user info from backend
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // fetch logged-in user details from backend
    const fetchUser = async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch("http://localhost:5000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) return <p className="text-center mt-20">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {user?.role === "teacher" ? (
        <TeacherDashboard teacher={user} />
      ) : (
        <StudentDashboard student={user} />
      )}
    </div>
  );
};

export default Dashboard;
