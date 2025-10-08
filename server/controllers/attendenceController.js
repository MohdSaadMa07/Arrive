import User from '../models/userModel.js';
import Attendance from '../models/attendance.js';

const euclideanDistance = (desc1, desc2) => {
    if (!desc1 || !desc2 || desc1.length !== desc2.length) {
        return Infinity;
    }
    let sumOfSquares = 0;
    for (let i = 0; i < desc1.length; i++) {
        sumOfSquares += Math.pow(desc1[i] - desc2[i], 2);
    }
    return Math.sqrt(sumOfSquares);
};

export const verifyFace = async (req, res) => {
    const { candidateDescriptor, sessionId } = req.body; // Also expect sessionId for attendance marking
    const DISTANCE_THRESHOLD = 0.6; 

    if (!candidateDescriptor || candidateDescriptor.length !== 128) {
        return res.status(400).json({ message: 'Invalid or missing candidate face descriptor.' });
    }
    if (!sessionId) {
        return res.status(400).json({ message: 'Missing session ID for attendance marking.' });
    }

    try {
        const registeredUsers = await User.find({}).select('uid fullName role studentId facultyId faceDescriptor');
        if (registeredUsers.length === 0) {
            return res.status(404).json({ message: 'No registered faces found in the database.' });
        }

        let bestMatch = null;
        let lowestDistance = Infinity;

        for (const user of registeredUsers) {
            const distance = euclideanDistance(candidateDescriptor, user.faceDescriptor);
            if (distance < lowestDistance) {
                lowestDistance = distance;
                bestMatch = user;
            }
        }

        if (lowestDistance <= DISTANCE_THRESHOLD && bestMatch) {
            // Mark attendance as present or update the record
            await Attendance.findOneAndUpdate(
                { sessionId, studentUid: bestMatch.uid },
                { status: "present", markedAt: new Date() },
                { upsert: true, new: true }
            );

            return res.status(200).json({
                success: true,
                message: `Face verified and attendance marked for ${bestMatch.fullName}. Distance: ${lowestDistance.toFixed(4)}.`,
                user: {
                    uid: bestMatch.uid,
                    fullName: bestMatch.fullName,
                    role: bestMatch.role,
                    studentId: bestMatch.studentId,
                    facultyId: bestMatch.facultyId
                }
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'Face not recognized. Please register or try again.',
                details: {
                    lowestDistance,
                    threshold: DISTANCE_THRESHOLD
                }
            });
        }

    } catch (error) {
        console.error('Face verification error:', error);
        res.status(500).json({ error: error.message });
    }
};
