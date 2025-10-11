import Session from '../models/sessionModel.js';

export const getAttendanceSummary = async (req, res) => {
  try {
    const studentUid = req.uid;

    const summary = await Session.aggregate([
      // Step 1: group all sessions by subject
      {
        $group: {
          _id: "$subject",
          sessionIds: { $push: "$_id" },     // collect all session IDs of subject
          totalSessions: { $sum: 1 }
        }
      },
      // Step 2: $lookup: Find all attendance records for these sessions & this student
      {
        $lookup: {
          from: "attendances",
          let: { sessionIds: "$sessionIds" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$sessionId", "$$sessionIds"] },
                    { $eq: ["$studentUid", studentUid] },
                    { $eq: ["$status", "present"] }
                  ]
                }
              }
            }
          ],
          as: "attendedList"
        }
      },
      // Step 3: Add attendance count and percent
      {
        $addFields: {
          lecturesAttended: { $size: "$attendedList" },
          absent: { $subtract: ["$totalSessions", { $size: "$attendedList" }] }, // count absent too
          attendancePercent: {
            $cond: [
              { $gt: ["$totalSessions", 0] },
              { $multiply: [
                  { $divide: [ { $size: "$attendedList" }, "$totalSessions" ] }, 100
                ]
              },
              0
            ]
          }
        }
      },
      {
        $project: {
          subject: "$_id",
          totalSessions: 1,
          lecturesAttended: 1,
          absent: 1,
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
