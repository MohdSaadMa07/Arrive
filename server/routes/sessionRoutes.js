import express from 'express';
import { createSession, getSessionsByFaculty } from '../controllers/sessionController.js';

const router = express.Router();

// Remove the extra '/sessions' path here. Just define routes at '/'
router.post('/', createSession);
router.get('/', getSessionsByFaculty);

export default router;
