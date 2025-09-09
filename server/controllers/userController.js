import User from '../models/userModel.js';
import ProfileImage from '../models/profileImageModel.js';

export const registerUser = async (req, res) => {
  try {
    const { uid, email, fullName, role, studentId, facultyId, profileImage } = req.body;

    // Check if user already exists
    let existingUser = await User.findOne({ uid });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const user = new User({
      uid,
      email,
      fullName,
      role,
      profileImage,
      studentId: role === "student" ? studentId : null,
      facultyId: role === "teacher" ? facultyId : null,
    });

    await user.save();
    
    // Also save to profile images collection
    const newProfileImage = new ProfileImage({
      userId: uid,
      email,
      image: profileImage
    });
    
    await newProfileImage.save();
    
    res.status(201).json({ message: "User registered successfully", user });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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