const express = require('express');
console.log("RUNNING EMS BACKEND v1");

const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes'); // ✅ upar add karo
const dashboardRoutes = require('./routes/dashboardRoutes');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5000",
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 🔥 SERVE FRONTEND
app.use(
  express.static(
    path.join(__dirname, '../Frontend/EMS2/EMS2/EMS2/EMS/public')
  )
);

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/EmployeeInfoMap1')
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/chatbot', chatbotRoutes); // ✅ yahan add karo
app.use('/api/dashboard', dashboardRoutes);

// Default route
app.get('/', (req, res) => {
  res.sendFile(
    path.join(__dirname, '../Frontend/EMS2/EMS2/EMS2/EMS/public/user/index.html')
  );
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));