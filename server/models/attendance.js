import mongoose from 'mongoose';

// Attendance model linking student (by uid) to session (sessionId)
const attendanceSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  studentUid: { type: String, required: true }, // references User.uid
  status: { type: String, enum: ['present', 'absent'], default: 'absent' },
  markedAt: { type: Date, default: Date.now },
});

attendanceSchema.index({ sessionId: 1, studentUid: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
