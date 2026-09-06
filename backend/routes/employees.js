const express = require("express");
const router = express.Router();

module.exports = (db) => {

router.post("/api/employees", async (req, res) => {

try {

const { name, email, phone, skills, status } = req.body;

const employee = {
name,
email,
phone,
skills,
status
};

await db.collection("employees").insertOne(employee);

res.json({
message: "Candidate saved successfully"
});

} catch (error) {

console.log(error);

res.status(500).json({
message: "Error saving candidate"
});

}

});

return router;

};