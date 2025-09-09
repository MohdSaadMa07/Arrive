import express from 'express';
import {
  uploadProfileImage,
  getProfileImage
} from '../controllers/imageController.js';

const router = express.Router();

// Upload profile image
router.post('/upload-profile-image', uploadProfileImage);

// Get profile image by user ID
router.get('/profile-image/:userId', getProfileImage);

export default router;