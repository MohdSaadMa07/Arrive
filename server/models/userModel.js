import mongoose from 'mongoose';

// Define the schema for storing user data, including the face descriptor and profile image.
const userSchema = new mongoose.Schema({
    // UID from Firebase Authentication
    uid: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['student', 'teacher'],
        required: true,
    },
    studentId: {
        type: String,
        required: function() { return this.role === 'student'; },
        sparse: true, // Allows null/undefined values to be stored, but indexes non-null ones
    },
    facultyId: {
        type: String,
        required: function() { return this.role === 'teacher'; },
        sparse: true,
    },
    // The face descriptor: stored as an array of numbers (Float32Array converted to Array)
    faceDescriptor: {
        type: [Number], // Array of Numbers
        required: true,
    },
    // The profile image: stored as a Base64 string (TEXT in the DB)
    profileImage: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const User = mongoose.model('User', userSchema);
export default User;
