import Session from '../models/sessionModel.js';

export const createSession = async (req, res) => {
  try {
    const { subject, facultyId, date, startTime, endTime, latitude, longitude } = req.body;

    if (!(subject && facultyId && date && startTime && endTime && latitude !== undefined && longitude !== undefined)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Parse as local IST
    const startTimeIST = new Date(startTime);
    const endTimeIST = new Date(endTime);
    if (endTimeIST <= startTimeIST) {
      return res.status(400).json({ message: "Session end time must be after start time." });
    }

    const session = new Session({
      subject,
      facultyId,
      date: new Date(date),
      startTime: startTimeIST,
      endTime: endTimeIST,
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

// Get sessions filtered by facultyId (teacher) — unchanged
export const getSessionsByFaculty = async (req, res) => {
  try {
    const { facultyId } = req.query;
    let sessions;
    if (facultyId) {
      sessions = await Session.find({ facultyId });
    } else {
      sessions = await Session.find(); // return all sessions if no facultyId provided
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
