import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
  studentUid: { type: String, required: true }, // links to User.uid
  status: { type: String, enum: ["present", "absent"], default: "absent" },
  markedAt: { type: Date, default: Date.now },
});

attendanceSchema.index({ sessionId: 1, studentUid: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
