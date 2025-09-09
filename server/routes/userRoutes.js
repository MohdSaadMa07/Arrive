import express from 'express';
import {
  registerUser,
  getUserByUid
} from '../controllers/userController.js';

const router = express.Router();

// Register new user
router.post('/register', registerUser);

// Get user by UID
router.get('/:uid', getUserByUid);

export default router;