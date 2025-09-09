import mongoose from 'mongoose';

const profileImageSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  image: { type: Buffer, required: true }, 
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

profileImageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

profileImageSchema.index({ userId: 1 });
profileImageSchema.index({ email: 1 });
profileImageSchema.index({ createdAt: -1 });

const ProfileImage = mongoose.model('ProfileImage', profileImageSchema);
export default ProfileImage;
