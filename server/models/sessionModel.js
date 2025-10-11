import mongoose from 'mongoose';

// Session model with subject as string
const sessionSchema = new mongoose.Schema({
  subject: { type: String, required: true }, // Subject name string
  facultyId: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Session = mongoose.model('Session', sessionSchema);
export default Session;
