// userRoutes.js
import express from 'express';
import {
  registerUser,
  getUserProfile,
  getCurrentUser,
  loginUser,
  verifyFace,
  getAllDescriptors
} from '../controllers/userController.js';
import {
  getAllStudents,
  getAttendanceSummaryByUid,
  sendAttendanceNotice
} from '../controllers/attendanceController.js';
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify', verifyFace);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);
router.get('/students', authenticateToken, getAllStudents);          // <-- THIS FIRST!
router.get('/descriptors', authenticateToken, getAllDescriptors);
router.get('/attendance/summary/:studentUid', authenticateToken, getAttendanceSummaryByUid);
router.post('/notice/send', authenticateToken, sendAttendanceNotice);
router.get('/:uid', authenticateToken, getUserProfile);              // <-- THIS LAST!

export default router;
