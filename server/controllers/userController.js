import User from '../models/userModel.js';
// Removed: import ProfileImage from '../models/profileImage.js';

// --- Helper function to calculate Euclidean distance (same logic face-api.js uses) ---
/**
 * Calculates the Euclidean distance between two face descriptors (arrays of numbers).
 * @param {number[]} desc1 - The first face descriptor (128-dimension array).
 * @param {number[]} desc2 - The second face descriptor (128-dimension array).
 * @returns {number} The distance measure. Lower is a closer match.
 */
const euclideanDistance = (desc1, desc2) => {
    if (!desc1 || !desc2 || desc1.length !== desc2.length) {
        // If descriptors are missing or misformed, return a distance above the threshold
        return Infinity; 
    }
    let sumOfSquares = 0;
    for (let i = 0; i < desc1.length; i++) {
        sumOfSquares += Math.pow(desc1[i] - desc2[i], 2);
    }
    return Math.sqrt(sumOfSquares);
};
// ----------------------------------------------------------------------------------


// @desc    Register a new user and save face data
// @route   POST /api/users/register
// @access  Public (Should be protected in production)
export const registerUser = async (req, res) => {
    const { 
        uid, 
        email, 
        fullName, 
        role, 
        studentId, 
        facultyId, 
        profileImage,
        faceDescriptor 
    } = req.body;

    // Check for essential fields, including the faceDescriptor and profileImage
    if (!uid || !email || !fullName || !role || !profileImage || !faceDescriptor) {
        return res.status(400).json({ message: 'Missing required fields for registration (UID, Email, Name, Role, Profile Image, or Face Descriptor).' });
    }

    try {
        // 1. Check if user already exists
        const existingUser = await User.findOne({ uid });

        if (existingUser) {
            return res.status(400).json({ message: 'User already registered.' });
        }

        // 2. Create the main User document, storing ALL data 
        const user = new User({
            uid,
            email,
            fullName,
            role,
            studentId: role === "student" ? studentId : null,
            facultyId: role === "teacher" ? facultyId : null,
            faceDescriptor, 
            profileImage, // Store the full Base64 string directly
        });

        await user.save();

        // 3. Success response
        // Return public user data only, excluding the faceDescriptor for security/efficiency
        const userData = {
            uid: user.uid,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            studentId: user.studentId,
            facultyId: user.facultyId,
        };

        res.status(201).json({ message: 'User registered successfully with face data.', user: userData });
        
    } catch (error) {
        // Handle MongoDB duplicate key errors 
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Email or UID already in use.' });
        }
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
};


// @desc    Get user profile by UID
// @route   GET /api/users/:uid
// @access  Private (Needs auth check in a real app)
export const getUserProfile = async (req, res) => {
    const { uid } = req.params;
    
    try {
        // Fetch user profile. Exclude faceDescriptor for general profile fetch.
        const user = await User.findOne({ uid }).select('-faceDescriptor');

        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'User not found.' });
        }
    } catch (error) {
        console.error('Fetch user error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get currently logged in user info
// @route   GET /api/users/current
// @access  Private (Requires auth middleware)
export const getCurrentUser = async (req, res) => {
    try {
        const uid = req.uid; 
        if (!uid) {
            return res.status(401).json({ message: "Unauthorized: Missing UID from token." });
        }

        // Fetch user profile, excluding the face descriptor
        const user = await User.findOne({ uid }).select('-faceDescriptor');
        if (!user) return res.status(404).json({ message: "User not found" });
        
        res.status(200).json(user);
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Login User (Assuming Firebase Auth handles credentials and sets req.uid)
// @route   POST /api/users/login (or often just /api/auth/login)
// @access  Private (Requires auth middleware to set req.uid after token verification)
export const loginUser = async (req, res) => {
    try {
        const uid = req.uid;
        if (!uid) {
            return res.status(401).json({ message: "Unauthorized: Missing UID after authentication." });
        }
        
        // Fetch user profile, excluding the face descriptor
        const user = await User.findOne({ uid }).select('-faceDescriptor');
        if (!user) return res.status(404).json({ message: "User not found in database. Please register." });

        res.status(200).json(user);
    } catch (error) {
        console.error('Login user error:', error);
        res.status(500).json({ error: error.message });
    }
};

// ----------------------------------------------------------------------------------
// Endpoint to fetch only the descriptor for face verification
// ----------------------------------------------------------------------------------

// @desc    Get all registered face descriptors (for matching against a new face)
// @route   GET /api/users/descriptors
// @access  Private/Admin (Very sensitive data, often used internally by the server)
export const getAllDescriptors = async (req, res) => {
    try {
        // Retrieve ONLY the UID, role, and faceDescriptor fields for all users
        const users = await User.find({}).select('uid role faceDescriptor');
        
        // Map the result to a clean array of objects
        const descriptors = users.map(user => ({
            uid: user.uid,
            role: user.role,
            descriptor: user.faceDescriptor 
        }));

        res.status(200).json(descriptors);
    } catch (error) {
        console.error('Error fetching all descriptors:', error);
        res.status(500).json({ error: error.message });
    }
};


// ----------------------------------------------------------------------------------
// NEW: Endpoint for Face Verification (Attendance Check)
// ----------------------------------------------------------------------------------

// @desc    Verify a new face descriptor against all registered users
// @route   POST /api/users/verify
// @access  Public (Used for quick check-in)
export const verifyFace = async (req, res) => {
    const { candidateDescriptor } = req.body;
    // face-api.js uses a default distance threshold of 0.6 for a match
    const DISTANCE_THRESHOLD = 0.6; 

    if (!candidateDescriptor || candidateDescriptor.length !== 128) {
        return res.status(400).json({ message: 'Invalid or missing candidate face descriptor.' });
    }

    try {
        // 1. Fetch all registered descriptors from the database
        // We retrieve necessary user info along with the descriptor
        const registeredUsers = await User.find({}).select('uid fullName role studentId facultyId faceDescriptor');

        if (registeredUsers.length === 0) {
            return res.status(404).json({ message: 'No registered faces found in the database.' });
        }

        let bestMatch = null;
        let lowestDistance = Infinity;

        // 2. Iterate through all registered users and find the best match
        for (const user of registeredUsers) {
            const registeredDescriptor = user.faceDescriptor;
            
            // Calculate the distance between the new face and the registered face
            const distance = euclideanDistance(candidateDescriptor, registeredDescriptor);

            if (distance < lowestDistance) {
                lowestDistance = distance;
                // Store the user info for the best match so far
                bestMatch = {
                    uid: user.uid,
                    fullName: user.fullName,
                    role: user.role,
                    studentId: user.studentId,
                    facultyId: user.facultyId,
                };
            }
        }

        // 3. Check if the best match is below the confidence threshold
        if (lowestDistance <= DISTANCE_THRESHOLD && bestMatch) {
            // Found a match!
            const matchedUser = {
                ...bestMatch,
                distance: lowestDistance,
            };
            
            // At this point, you would typically log the attendance record in a separate collection.
            
            return res.status(200).json({ 
                success: true, 
                message: `Face verified for ${matchedUser.fullName}. Lowest distance: ${lowestDistance.toFixed(4)}.`, 
                user: matchedUser 
            });
        } else {
            // No match found below the threshold
            return res.status(404).json({ 
                success: false, 
                message: 'Face not recognized. Please register or try again.',
                details: { 
                    lowestDistance: lowestDistance,
                    threshold: DISTANCE_THRESHOLD
                }
            });
        }

    } catch (error) {
        console.error('Face verification error:', error);
        res.status(500).json({ error: error.message });
    }
};
