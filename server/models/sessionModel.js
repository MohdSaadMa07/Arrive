import mongoose from 'mongoose';

// Session model with subject as string
const sessionSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  facultyId: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  latitude: { type: Number, required: true },    // new field
  longitude: { type: Number, required: true },   // new field
  createdAt: { type: Date, default: Date.now },
});


const Session = mongoose.model('Session', sessionSchema);
export default Session;
