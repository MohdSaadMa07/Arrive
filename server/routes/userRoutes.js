import express from 'express';
import {
    registerUser,
    getUserProfile,
    getCurrentUser,
    loginUser,
    verifyFace,      // <-- New: Facial verification for attendance
    getAllDescriptors // <-- New: Internal method to fetch all face data
} from '../controllers/userController.js';
import { authenticateToken } from "../middleware/authMiddleware.js";


const router = express.Router();

// Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser); // Allows users to login via Firebase (token is verified by middleware/client)
router.post('/verify', verifyFace); // Attendance check-in endpoint

// Protected Routes (Require authentication middleware, authenticateToken)
router.get('/me', authenticateToken, getCurrentUser);
router.get('/:uid', authenticateToken, getUserProfile); // Fetch profile by specific UID
router.get('/descriptors', authenticateToken, getAllDescriptors); // For Admin/Internal server use

export default router;
