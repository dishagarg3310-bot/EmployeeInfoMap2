const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  empId: {
    type: String,
    required: true,
    unique: true
  },

  departmentInfo: {
    department: String,
    designation: String,
    joiningDate: String,
    presentAppDate: String,
    payScale: String,
    firstName: String,
    middleName: String,
    lastName: String
  },

  personalInfo: {
    fatherName: String,
    motherName: String,
    gender: String,
    maritalStatus: String,
    spouseName: String,
    email: String,
    phone: String,
    address1: String,
    address2: String,
    motherTongue: String,
    category: String,
    city: String,
    state: String,
    pincode: String
  },

  status: {
    type: String,
    enum: ["new", "active"],
    default: "new"
  },

  // ✅ Profile Photo (Base64 encoded)
  profilePhoto: {
    type: String,
    default: null // Will store Base64 data URL
  },

  // ✅ ID Card Fields
  idCardGenerated: {
    type: Boolean,
    default: false
  },

  idCardData: {
    empId: String,
    firstName: String,
    middleName: String,
    lastName: String,
    department: String,
    designation: String,
    joiningDate: String,
    phone: String,
    qrData: String,
    generatedAt: String
  }
}, { timestamps: true });

module.exports = mongoose.model("Employee", employeeSchema);