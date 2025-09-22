import express from 'express';
import {
  registerUser,
  getUserByUid,
   getCurrentUser } from '../controllers/userController.js';
import { authenticateToken } from "../middleware/authMiddleware.js";


const router = express.Router();

// Register new user
router.post('/register', registerUser);

// Get user by UID
router.get('/:uid', getUserByUid);

// Get currently logged in user's info
router.get('/me', authenticateToken, getCurrentUser);


export default router;