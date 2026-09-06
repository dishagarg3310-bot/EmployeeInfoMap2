const express = require("express");
const Candidate = require("../models/candidate");
const Employee = require("../models/employee");
const User = require("../models/user");
const Activity = require("../models/activity");
const bcrypt = require("bcryptjs");

const router = express.Router();

/* ================================
   GET ALL CANDIDATES ✅ FIX
================================ */
router.get("/", async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ createdAt: -1 });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================================
   CREATE CANDIDATE + ACTIVITY
================================ */
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, skills, status } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const candidate = await Candidate.create({
      name,
      email,
      phone,
      skills: Array.isArray(skills) ? skills : [],
      status: (status || "NEW").toUpperCase()
    });

    // ✅ HR Activity
    await Activity.create({
      text: `Resume parsed: ${candidate.name}`,
      type: "hr"
    });

    res.json({ message: "Candidate saved successfully", candidate });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================================
   GET CANDIDATE BY ID
================================ */
router.get("/:id", async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================================
   DELETE CANDIDATE
================================ */
router.delete("/:id", async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }
    res.json({ message: "Candidate deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================================
   CONVERT TO EMPLOYEE
================================ */
router.post("/:id/to-employee", async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    const nameParts = (candidate.name || "").trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const empId = req.body.empId || `EMP_${Date.now()}`;

    const password = empId + "@123";
    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName: candidate.name,
      username: empId,
      email: candidate.email,
      password: hashed,
      role: "user"
    });

    const employee = await Employee.create({
      empId,
      userId: user._id,
      departmentInfo: {
        firstName,
        lastName,
        department: req.body.departmentInfo?.department || "",
        designation: req.body.departmentInfo?.designation || "",
        joiningDate: req.body.departmentInfo?.joiningDate || "",
        presentAppDate: req.body.departmentInfo?.presentAppDate || "",
        payScale: req.body.departmentInfo?.payScale || ""
      },
      personalInfo: {
        email: candidate.email,
        phone: candidate.phone
      },
      status: "active"
    });

    await Candidate.findByIdAndUpdate(req.params.id, { status: "CONVERTED" });

    res.json({
      message: "Candidate converted successfully",
      employee,
      login: { username: empId, password }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;