import express from 'express';
import { getAttendanceSummary } from '../controllers/attendanceController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getAttendanceSummary);

export default router;
