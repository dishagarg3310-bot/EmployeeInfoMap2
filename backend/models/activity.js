const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  text: String,
  type: {
    type: String,
    enum: ["admin", "hr"],
    default: "admin"
  },
  time: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Activity", activitySchema);