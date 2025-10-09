import Session from '../models/sessionModel.js';

// Create a new session — accept subject name directly without validating Subject collection
export const createSession = async (req, res) => {
  try {
    console.log('Request Body:', req.body);
    const { subject, facultyId, date, startTime, endTime } = req.body;

    if (!(subject && facultyId && date && startTime && endTime)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const session = new Session({
      subject,
      facultyId,
      date: new Date(date),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
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