import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true }, // Firebase UID
  email: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ["student", "teacher"], required: true },
  studentId: { type: String },  // only if role = student
  facultyId: { type: String },  // only if role = teacher
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
