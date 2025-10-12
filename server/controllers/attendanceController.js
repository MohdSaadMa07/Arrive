import User from '../models/userModel.js';
import Attendance from '../models/attendance.js';
import Session from '../models/sessionModel.js';

// Helper: Euclidean distance for face descriptors
const euclideanDistance = (desc1, desc2) => {
  if (!desc1 || !desc2 || desc1.length !== desc2.length) return Infinity;
  let sumOfSquares = 0;
  for (let i = 0; i < desc1.length; i++) {
    sumOfSquares += Math.pow(desc1[i] - desc2[i], 2);
  }
  return Math.sqrt(sumOfSquares);
};

// Always compare using UTC dates
const toUTC = (date) => new Date(date.toISOString());

export const verifyFaceAndMarkAttendance = async (req, res) => {
  const { candidateDescriptor, sessionId } = req.body;
  const DISTANCE_THRESHOLD = 0.6;

  if (!candidateDescriptor || candidateDescriptor.length !== 128) {
    return res.status(400).json({ message: "Invalid or missing candidate face descriptor." });
  }
  if (!sessionId) {
    return res.status(400).json({ message: "Missing session ID for attendance marking." });
  }

  try {
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    const now = new Date();
    const startTime = new Date(session.startTime);
    const endTime = new Date(session.endTime);

    // Always compare UTC values
    const nowUTC = toUTC(now);
    const startUTC = toUTC(startTime);
    const endUTC = toUTC(endTime);

    console.log('now (ISO):', nowUTC.toISOString());
    console.log('startTime (ISO):', startUTC.toISOString());
    console.log('endTime (ISO):', endUTC.toISOString());

    if (nowUTC < startUTC || nowUTC > endUTC) {
      return res.status(400).json({
        message: "Attendance can only be marked during the scheduled session time.",
        sessionStart: startUTC.toISOString(),
        sessionEnd: endUTC.toISOString(),
        currentTime: nowUTC.toISOString(),
      });
    }

    const registeredUsers = await User.find({}).select(
      "uid fullName role studentId facultyId faceDescriptor"
    );
    if (registeredUsers.length === 0) {
      return res.status(404).json({ message: "No registered faces found in the database." });
    }

    // Find best face descriptor match
    let bestMatch = null;
    let lowestDistance = Infinity;
    for (const user of registeredUsers) {
      const distance = euclideanDistance(candidateDescriptor, user.faceDescriptor);
      if (distance < lowestDistance) {
        lowestDistance = distance;
        bestMatch = user;
      }
    }

    if (lowestDistance <= DISTANCE_THRESHOLD && bestMatch) {
      await Attendance.findOneAndUpdate(
        { sessionId, studentUid: bestMatch.uid },
        { status: "present", markedAt: nowUTC },
        { upsert: true, new: true }
      );

      return res.status(200).json({
        success: true,
        message: `Face verified and attendance marked for ${bestMatch.fullName}. Distance: ${lowestDistance.toFixed(4)}.`,
        user: {
          uid: bestMatch.uid,
          fullName: bestMatch.fullName,
          role: bestMatch.role,
          studentId: bestMatch.studentId,
          facultyId: bestMatch.facultyId,
        },
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Face not recognized. Please register or try again.",
        details: { lowestDistance, threshold: DISTANCE_THRESHOLD },
      });
    }
  } catch (error) {
    console.error("Face verification error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const markAttendance = async (req, res) => {
  const { sessionId } = req.body;
  const studentUid = req.uid;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID required' });
  }

  try {
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Always use local IST times (no conversion)
    const now = new Date();
    if (now < session.startTime || now > session.endTime) {
      return res.status(400).json({
        error: "Attendance can only be marked during the scheduled session time.",
        sessionStart: session.startTime,
        sessionEnd: session.endTime,
        currentTime: now,
      });
    }

    const attendanceRecord = await Attendance.findOneAndUpdate(
      { sessionId, studentUid },
      { status: 'present', markedAt: now },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Attendance marked successfully', attendanceRecord });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};

// Corrected session creation: always store start/end in UTC with "Z"
export const createSession = async (req, res) => {
  try {
    console.log('Request Body:', req.body);
    const { subject, facultyId, date, startTime, endTime, latitude, longitude } = req.body;

    if (!(subject && facultyId && date && startTime && endTime && latitude !== undefined && longitude !== undefined)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Compose start/end as ISO UTC string and parse as Date, for MongoDB to store in UTC
    const startISO = new Date(`${date}T${startTime}:00.000Z`);
    const endISO = new Date(`${date}T${endTime}:00.000Z`);

    const session = new Session({
      subject,
      facultyId,
      date: new Date(date), // still stores at 00:00 UTC of that date
      startTime: startISO,
      endTime: endISO,
      latitude,
      longitude,
    });

    await session.save();
    res.status(201).json(session);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ message: 'Failed to create session', error: error.message });
  }
};

export const getSessionsByFaculty = async (req, res) => {
  try {
    const { facultyId } = req.query;
    let sessions;
    if (facultyId) {
      sessions = await Session.find({ facultyId });
    } else {
      sessions = await Session.find();
    }
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch sessions", error: error.message });
  }
};

export const getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find();
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch sessions", error: error.message });
  }
};
