import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  facultyId: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

sessionSchema.index({ facultyId: 1, date: 1 });

export default mongoose.model('Session', sessionSchema);
