import Session from "../models/sessionsModel.js"; // Changed from sessionsModel to Session

// Create a new session
export const createSession = async (req, res) => {
  try {
    const { subject, facultyId, date, startTime, endTime } = req.body;

    const session = new Session({
      subject,
      facultyId,
      date: new Date(date),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    });

    const savedSession = await session.save();
    res.status(201).json(savedSession);
  } catch (err) {
    console.error("Error creating session:", err);
    res.status(500).json({ message: "Failed to create session", error: err.message });
  }
};

// Get sessions for a specific teacher by facultyId
export const getSessionsByTeacher = async (req, res) => {
  try {
    const { facultyId } = req.params;
    console.log(`Fetching sessions for faculty: ${facultyId}`); // Debug log
    
    const sessions = await Session.find({ facultyId }).sort({ date: 1, startTime: 1 });
    console.log(`Found ${sessions.length} sessions for faculty ${facultyId}`); // Debug log
    
    res.status(200).json(sessions);
  } catch (err) {
    console.error("Error fetching sessions:", err);
    res.status(500).json({ message: "Failed to fetch sessions", error: err.message });
  }
};