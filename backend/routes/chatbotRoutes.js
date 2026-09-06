const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Try to import Employee model
let Employee;
try {
    Employee = require('../models/employee');
} catch(e) {
    Employee = null;
}

router.post('/message', async (req, res) => {
    const { message, role } = req.body;
    if (!message) return res.status(400).json({ reply: "Message not received!" });

    // ✅ Database se real data fetch karo
    let dbContext = "";
    try {
        const totalUsers = await User.countDocuments();
        const adminCount = await User.countDocuments({ role: 'admin' });
        const hrCount = await User.countDocuments({ role: 'hr' });
        const userCount = await User.countDocuments({ role: 'user' });

        let employeeCount = 0;
        if (Employee) {
            employeeCount = await Employee.countDocuments();
        }

        dbContext = `
Current EMS Database Information:
- Total registered users: ${totalUsers}
- Admin users: ${adminCount}
- HR users: ${hrCount}
- Faculty/Users: ${userCount}
- Total employees in system: ${employeeCount}
`;
    } catch(err) {
        console.error("DB fetch error:", err);
    }

    const systemPrompt = `You are a helpful assistant for an Employee Management System (EMS) called "EmployeeInfo Map".
You help ${role || 'users'} with questions related to:
- Employee information and records
- Attendance tracking and policies
- Leave applications and HR policies
- HR processes and procedures
- General EMS system help
- Admin and HR workflows

${dbContext}

When asked about counts, numbers, or statistics, use the above database information to give direct answers.
Always respond in English only.
Format your responses clearly with proper line breaks between points.
Use numbered lists with line breaks for step-by-step instructions.
Keep responses concise and helpful.`;

    try {
        const response = await fetch(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: message }
                    ],
                    max_tokens: 500
                })
            }
        );
        const data = await response.json();
        const reply = data?.choices?.[0]?.message?.content || "No answer found!";
        res.json({ reply });
    } catch (err) {
        console.error("Groq error:", err);
        res.status(500).json({ reply: "Server error! Please try again later." });
    }
});

module.exports = router;