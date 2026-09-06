const express = require("express");
console.log("EMPLOYEE ROUTES LOADED");
const bcrypt = require("bcryptjs");

const User = require("../models/user");
const Employee = require("../models/employee");

const router = express.Router();

/* ================================
   ADMIN — GET ALL EMPLOYEES
================================ */
router.get("/", async (req, res) => {
  try {
    const { role } = req.query;
    let employees;
    
    if (role) {
      // Filter employees by user role
      const users = await User.find({ role: role });
      const userIds = users.map(u => u._id);
      employees = await Employee.find({ userId: { $in: userIds } });
    } else {
      employees = await Employee.find();
    }
    

    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================================
   USER — GET OWN PROFILE  ✅ (upar rakha)
================================ */
router.get("/me/:userId", async (req, res) => {
  try {
    const emp = await Employee.findOne({ userId: req.params.userId });
    if (!emp) return res.status(404).json({ message: "Employee not found" });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================================
   USER — UPDATE PERSONAL INFO ✅ (upar rakha)
================================ */
router.put("/me/:userId", async (req, res) => {
  try {
    const emp = await Employee.findOne({ userId: req.params.userId });
    if (!emp) return res.status(404).json({ message: "Employee not found" });
    
    // Validate phone number if provided
    if (req.body.phone && req.body.phone.trim()) {
      const phone = req.body.phone.trim().replace(/\s/g, '');
      
      // Phone format validation: +91 followed by 10 digits
      const phoneRegex = /^\+91\d{10}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ message: "Phone number must have +91 followed by 10 digits" });
      }

      // Check for duplicate phone numbers (excluding current employee's own number)
      const existingPhone = await Employee.findOne({
        'personalInfo.phone': phone,
        _id: { $ne: emp._id }
      });
      
      if (existingPhone) {
        return res.status(400).json({ message: "This phone number is already registered in the system" });
      }

      // Store phone without spaces
      req.body.phone = phone;
    }
    
    // Handle profilePhoto separately if provided
    if (req.body.profilePhoto) {
      emp.profilePhoto = req.body.profilePhoto;
    }
    
    // Update personalInfo with remaining fields (excluding profilePhoto)
    const { profilePhoto, ...personalInfoData } = req.body;
    emp.personalInfo = { ...emp.personalInfo, ...personalInfoData };
    
    await emp.save();
    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================================
   ADMIN — CREATE NEW HIRE
================================ */
router.post("/newhire", async (req, res) => {
  const emp = await Employee.create({
    empId: req.body.empId,
    departmentInfo: {
      firstName: req.body.firstName,
      middleName: req.body.middleName,
      lastName: req.body.lastName
    },
    status: "new"
  });
  res.json(emp);
});

/* ================================
   ADMIN — CONVERT NEW HIRE → ACTIVE
================================ */
router.post("/create", async (req, res) => {
  try {
    const { empId, firstName, middleName, lastName, departmentInfo } = req.body;

    const password = empId + "@123";
    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName: `${firstName} ${middleName || ""} ${lastName}`.trim(),
      username: empId,
      email: empId + "@ems.local",
      password: hashed,
      role: "user"
    });

    const employee = await Employee.findOneAndUpdate(
      { empId },
      {
        userId: user._id,
        departmentInfo: {
          ...departmentInfo,
          firstName,
          middleName,
          lastName
        },
        status: "active"
      },
      { new: true }
    );

    res.json({
      message: "Employee activated",
      login: { username: empId, password },
      employee
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ======================================
   ADMIN — GENERATE ID CARD
====================================== */
router.post("/admin/idcard/:empId", async (req, res) => {
  try {
    const emp = await Employee.findOne({ empId: req.params.empId });
    if (!emp) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (emp.idCardGenerated && emp.idCardData) {
      return res.json({
        message: "ID card already generated",
        card: emp.idCardData
      });
    }

    const idCardData = {
      empId: emp.empId,
      firstName: emp.departmentInfo?.firstName || "",
      lastName: emp.departmentInfo?.lastName || "",
      department: emp.departmentInfo?.department || "",
      designation: emp.departmentInfo?.designation || "",
      qrData: `http://localhost:5000/qr-verify.html?empId=${emp.empId}`
    };

    emp.idCardGenerated = true;
    emp.idCardData = idCardData;
    await emp.save();

    res.json({
      message: "ID card generated successfully",
      card: idCardData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ======================================
   ADMIN / USER — VIEW ID CARD
====================================== */
router.get("/idcard/:empId", async (req, res) => {
  try {
    const emp = await Employee.findOne({ empId: req.params.empId });
    if (!emp || !emp.idCardGenerated || !emp.idCardData) {
      return res.status(404).json({ message: "ID Card not found" });
    }
    res.json(emp.idCardData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ======================================
   VERIFY QR — Password check + details
====================================== */
router.post("/verify-qr", async (req, res) => {
  try {
    const { empId, password } = req.body;

    if (!empId || !password) {
      return res.status(400).json({ message: "empId and password required" });
    }

    const emp = await Employee.findOne({ empId });
    if (!emp) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const user = await User.findById(emp.userId);
    if (!user) {
      return res.status(404).json({ message: "User account not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password. Please try again." });
    }

    res.json({ employee: emp });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================================
   ADMIN — UPDATE DEPARTMENT INFO
================================ */
router.put("/:empId", async (req, res) => {
  const emp = await Employee.findOne({ empId: req.params.empId });
  if (!emp) return res.status(404).json({ message: "Employee not found" });
  emp.departmentInfo = { ...emp.departmentInfo, ...req.body };
  await emp.save();
  res.json(emp);
});

/* ================================
   ADMIN — DELETE EMPLOYEE
================================ */
router.delete("/:empId", async (req, res) => {
  await Employee.deleteOne({ empId: req.params.empId });
  await User.deleteOne({ username: req.params.empId });
  res.json({ message: "Employee deleted" });
});

module.exports = router;