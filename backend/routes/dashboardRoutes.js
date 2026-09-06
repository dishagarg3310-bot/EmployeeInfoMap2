const express = require("express");
const router = express.Router();

const mongoose = require("mongoose"); // ✅ ADD THIS
const Employee = require("../models/employee");
const Candidate = require("../models/candidate");
const Activity = require("../models/activity");
const User = require("../models/user");

/* ================================
   DASHBOARD STATS
================================ */
router.get("/stats", async (req, res) => {
  try {
    const users = await User.find({ role: "user" });

    // 🔥 FIX: ensure ObjectId
    const userIds = users.map(u => new mongoose.Types.ObjectId(u._id));

    const activeEmployees = await Employee.countDocuments({
      userId: { $in: userIds },
      status: "active"
    });

    const newHires = await Candidate.countDocuments({
      status: { $regex: /^new$/i }
    });

    console.log("STATS:", { activeEmployees, newHires });

    res.json({
      totalEmployees: activeEmployees + newHires,
      activeEmployees,
      newHires,
      departments: 10
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ================================
   DEPARTMENT DISTRIBUTION
================================ */
router.get("/distribution", async (req, res) => {
  try {
    const departments = ["CS","IT","CS-AI","EC","EE","EI","MT","CE","BT","VLSI"];

    const map = {
      "Computer Science": "CS",
      "Information Technology": "IT",
      "CS-AI": "CS-AI",
      "Electronics and Communication": "EC",
      "Electrical Engineering": "EE",
      "Electronics and Instrumentation": "EI",
      "Mechatronics": "MT",
      "Chemical Engineering": "CE",
      "Biotechnology": "BT",
      "VLSI": "VLSI"
    };

    const users = await User.find({ role: "user" });
    const userIds = users.map(u => new mongoose.Types.ObjectId(u._id));

    const data = await Employee.aggregate([
      {
        $match: {
          userId: { $in: userIds },
          status: "active"
        }
      },
      {
        $group: {
          _id: "$departmentInfo.department",
          count: { $sum: 1 }
        }
      }
    ]);

    let result = {};
    departments.forEach(dep => result[dep] = 0);

    data.forEach(d => {
      const mapped = map[d._id];
      if (mapped && result[mapped] !== undefined) {
        result[mapped] += d.count;
      }
    });

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/activity", async (req, res) => {
  try {
    const role = req.query.role; // 🔥 IMPORTANT

    let activities = [];

    // =========================
    // 🔵 ADMIN ACTIVITY
    // =========================
    if (role === "admin") {

      const logs = await Activity.find({ type: "admin" })
        .sort({ time: -1 })
        .limit(5);

      logs.forEach(log => {
        activities.push({
          text: log.text,
          time: log.time
        });
      });

      // Active employees (admin feature)
      const users = await User.find({ role: "user" });
      const userIds = users.map(u => new mongoose.Types.ObjectId(u._id));

      const activeUsers = await Employee.find({
        userId: { $in: userIds },
        status: "active"
      })
      .sort({ updatedAt: -1 })
      .limit(3);

      activeUsers.forEach(e => {
        const name = e.departmentInfo?.firstName || "Employee";
        activities.push({
          text: `Converted to active: ${name}`,
          time: e.updatedAt
        });
      });

      activities.push({
        text: "Admin profile 80% completed",
        time: new Date()
      });

    }

    // =========================
    // 🟢 HR ACTIVITY
    // =========================
    if (role === "hr") {

      const logs = await Activity.find({ type: "hr" })
        .sort({ time: -1 })
        .limit(5);

      logs.forEach(log => {
        activities.push({
          text: log.text,
          time: log.time
        });
      });

      // Resume count
      const totalResumes = await Candidate.countDocuments();
      activities.push({
        text: `Total resumes parsed: ${totalResumes}`,
        time: new Date()
      });

      activities.push({
        text: "HR profile 100% completed",
        time: new Date()
      });
    }

    // Remove duplicates
    const unique = [];
    const seen = new Set();

    activities.forEach(a => {
      if (!seen.has(a.text)) {
        seen.add(a.text);
        unique.push(a);
      }
    });

    res.json(
      unique.sort((a, b) => new Date(b.time) - new Date(a.time))
    );

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* ================================
   ADD ACTIVITY
================================ */
router.post("/log", async (req, res) => {
  try {
    await Activity.create({
      text: req.body.text
    });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
/* ================================
   HR RECENT ACTIVITY (SEPARATE)
================================ */
router.get("/hr-activity", async (req, res) => {
  try {
    let activities = [];

    /* =========================
       1. RESUME PARSED LOGS
    ========================= */
    const parsedLogs = await Activity.find({
      text: { $regex: /resume parsed/i }
    })
    .sort({ time: -1 })
    .limit(5);

    parsedLogs.forEach(log => {
      activities.push({
        text: log.text,
        time: log.time
      });
    });

    /* =========================
       2. TOTAL RESUME COUNT
    ========================= */
    const totalParsed = await Activity.countDocuments({
      text: { $regex: /resume parsed/i }
    });

    activities.push({
      text: `Total resumes parsed: ${totalParsed}`,
      time: new Date()
    });

    /* =========================
       3. HR PROFILE COMPLETION
    ========================= */
    const hrUser = await User.findOne({ role: "hr" });

    let percent = 0;

    if (hrUser) {
      let total = 3;
      let filled = 0;

      if (hrUser.fullName) filled++;
      if (hrUser.email) filled++;
      if (hrUser.username) filled++;

      percent = Math.round((filled / total) * 100);
    }

    activities.push({
      text: `HR profile ${percent}% completed`,
      time: new Date()
    });

    /* =========================
       REMOVE DUPLICATES + SORT
    ========================= */
    const unique = [];
    const seen = new Set();

    activities.forEach(a => {
      if (!seen.has(a.text)) {
        seen.add(a.text);
        unique.push(a);
      }
    });

    res.json(
      unique.sort((a, b) => new Date(b.time) - new Date(a.time))
    );

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;