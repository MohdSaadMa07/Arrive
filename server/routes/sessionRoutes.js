import express from "express";
import { createSession, getSessionsByTeacher } from "../controllers/sessionController.js";

const router = express.Router();

router.post("/sessions", createSession);
router.get("/sessions/teacher/:facultyId", getSessionsByTeacher);

export default router;