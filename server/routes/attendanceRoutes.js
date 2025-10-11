import express from 'express';
import { getAttendanceSummary, markAttendance } from '../controllers/attendanceController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Keep the route path as '/'; assuming your API base is '/api/attendance'
router.get('/', authenticateToken, getAttendanceSummary);
router.get('/summary', authenticateToken, getAttendanceSummary);
router.post('/mark', authenticateToken, markAttendance);

export default router;
