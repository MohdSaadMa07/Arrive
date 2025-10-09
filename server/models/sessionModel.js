import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  subject: { type: String, required: true },  // change here
  facultyId: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});


export default mongoose.model('Session', sessionSchema);
