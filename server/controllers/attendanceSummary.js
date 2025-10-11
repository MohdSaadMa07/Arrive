import Attendance from '../models/attendance.js';

export const getAttendanceSummary = async (req, res) => {
  try {
    const studentUid = req.uid; // Set by auth middleware

    const summary = await Attendance.aggregate([
      { $match: { studentUid, status: "present" } },
      {
        $lookup: {
          from: "sessions",
          localField: "sessionId",
          foreignField: "_id",
          as: "sessionInfo"
        }
      },
      { $unwind: "$sessionInfo" },
      {
        $group: {
          _id: "$sessionInfo.subject",
          lecturesAttended: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "sessions",
          localField: "_id",
          foreignField: "subject",
          as: "allSessions"
        }
      },
      {
        $addFields: {
          totalSessions: { $size: "$allSessions" }
        }
      },
      {
        $addFields: {
          attendancePercent: {
            $multiply: [
              { $divide: ["$lecturesAttended", "$totalSessions"] },
              100
            ]
          }
        }
      },
      {
        $project: {
          subject: "$_id",
          lecturesAttended: 1,
          totalSessions: 1,
          attendancePercent: 1,
          _id: 0
        }
      }
    ]);

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch attendance summary", error: error.message });
  }
};


