import express from 'express';
import { createSession, getAllSessions } from '../controllers/sessionController.js';

const sessionrouter = express.Router();

// Base path: /api/sessions
sessionrouter.post('/sessions', createSession);   // POST /api/sessions
sessionrouter.get('/sessions', getAllSessions);   // GET /api/sessions

export default sessionrouter;
