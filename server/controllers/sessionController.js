import Session from '../models/sessionModel.js';

export const createSession = async (req, res) => {
  try {
    const { subject, facultyId, date, startTime, endTime } = req.body;
    const session = new Session({
      subject,
      facultyId,
      date: new Date(date),
      startTime: new Date(startTime),
      endTime: new Date(endTime)
    });
    const saved = await session.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create session', error: error.message });
  }
};

export const getAllSessions = async (req, res) => {
  console.log("getAllSessions route hit");
  try {
    const sessions = await Session.find();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

