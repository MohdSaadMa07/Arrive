import User from '../models/userModel.js';
import ProfileImage from '../models/profileImageModel.js';

// Register User
export const registerUser = async (req, res) => {
  try {
    const { uid, email, fullName, role, studentId, facultyId, profileImage } = req.body;

    const existingUser = await User.findOne({ uid });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const user = new User({
      uid,
      email,
      fullName,
      role,
      studentId: role === "student" ? studentId : null,
      facultyId: role === "teacher" ? facultyId : null,
      profileImage
    });

    await user.save();

    const newProfileImage = new ProfileImage({
      userId: uid,
      email,
      image: Buffer.from(profileImage.split(",")[1], 'base64') // store as binary
    });

    await newProfileImage.save();

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user by UID
export const getUserByUid = async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ uid });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get currently logged in user info
export const getCurrentUser = async (req, res) => {
  try {
    const uid = req.uid; // set by your auth middleware
    if (!uid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ uid });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const uid = req.uid;
    if (!uid) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await User.findOne({ uid });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};