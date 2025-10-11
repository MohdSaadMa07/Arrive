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
    // Fetch session to validate attendance time window
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    const now = new Date();

    // DEBUG LOG — confirm times
    console.log("Now:", now);
    console.log("Session startTime:", session.startTime);
    console.log("Session endTime:", session.endTime);

    if (now < session.startTime || now > session.endTime) {
      return res.status(400).json({
        message: "Attendance can only be marked during the scheduled session time.",
        sessionStart: session.startTime,
        sessionEnd: session.endTime,
        currentTime: now,
      });
    }

    // Fetch all registered users with face descriptors
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
      // Mark attendance present or update existing record
      await Attendance.findOneAndUpdate(
        { sessionId, studentUid: bestMatch.uid },
        { status: "present", markedAt: now },
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
    // Fetch the session document
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const now = new Date();

    // Enforce session time window
    if (now < session.startTime || now > session.endTime) {
      return res.status(400).json({
        error: "Attendance can only be marked during the scheduled session time.",
        sessionStart: session.startTime,
        sessionEnd: session.endTime,
        currentTime: now,
      });
    }

    // If within time window, proceed
    const attendanceRecord = await Attendance.findOneAndUpdate(
      { sessionId, studentUid },
      { status: 'present', markedAt: now },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Attendance marked successfully', attendanceRecord });
  } catch (err) {
    console.error('Error marking attendance:', err);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};

