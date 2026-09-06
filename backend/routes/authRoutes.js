const router = require('express').Router();
const User = require('../models/user');
const Employee = require('../models/employee');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// REGISTER
router.post('/signup', async (req, res) => {
    try {
        const { fullName, username, email, password, role, department, phone, address } = req.body;
        console.log("Role sent from Frontend:", role);
        
        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });

        if (existingUser) {
            return res.status(400).json({
                message: existingUser.email === email
                    ? "Email already registered"
                    : "Username already taken"
            });
        }

        // Validation for admin/hr roles
        if (role === 'admin' || role === 'hr') {
            // Validate department
            if (!department) {
                return res.status(400).json({ message: "Department is required" });
            }

            if (role === 'admin' && department !== 'Academic Administration') {
                return res.status(400).json({ message: "Admin must select 'Academic Administration'" });
            }

            if (role === 'hr' && department !== 'Human Resources') {
                return res.status(400).json({ message: "HR must select 'Human Resources'" });
            }

            // Validate phone format
            if (!phone) {
                return res.status(400).json({ message: "Contact Number is required" });
            }

            // Phone must start with +91 and have exactly 10 digits after
            const phoneRegex = /^\+91\d{10}$/;
            const phoneClean = phone.replace(/\s/g, ''); // Remove spaces for validation
            if (!phoneRegex.test(phoneClean)) {
                return res.status(400).json({ message: "Phone number must have +91 followed by 10 digits" });
            }

            // Check for duplicate phone numbers
            const existingPhone = await Employee.findOne({ 'personalInfo.phone': phoneClean });
            if (existingPhone) {
                return res.status(400).json({ message: "This phone number is already registered in the system" });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create user
        const newUser = new User({
            fullName,
            username,
            email,
            password: hashedPassword,
            role: role || 'user',
            isVerified: role === 'user' ? true : false,
            verificationToken
        });

        await newUser.save();

        // If admin or hr, create corresponding Employee record
        if (role === 'admin' || role === 'hr') {
            const nameParts = (fullName || "").trim().split(" ");
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ") || "";

            // Generate ID based on role
            const prefix = role === 'admin' ? 'ADM' : 'HR';
            const count = await Employee.countDocuments({ empId: new RegExp(`^${prefix}`) });
            const adminId = `${prefix}${String(count + 1).padStart(3, '0')}`;

            const employee = new Employee({
                empId: adminId,
                userId: newUser._id,
                departmentInfo: {
                    firstName: firstName,
                    lastName: lastName,
                    department: department || (role === 'admin' ? 'Administration' : 'Human Resources')
                },
                personalInfo: {
                    email: email,
                    phone: phone.replace(/\s/g, '') || "",
                    address1: address || ""
                },
                status: "active"
            });

            await employee.save();
        }

        // Send verification email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        const verifyUrl = `${baseUrl}/api/auth/verify/${verificationToken}`;

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Verify Your Account - Employee Info Map',
                html: `<h1>Account Verification</h1>
                       <p>Hello ${fullName},</p>
                       <p>Please click the button below to verify your account.</p>
                       <br>
                       <a href="${verifyUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px;">Verify Email</a>
                       <br><br>
                       <p>If the button doesn't work, copy and paste this link into your browser:</p>
                       <p><a href="${verifyUrl}">${verifyUrl}</a></p>`
            });
        } catch (mailErr) {
            console.error('Error sending verification email:', mailErr);
            // Proceed despite email failure, user will need to contact support or retry
        }

        res.status(201).json({ 
            message: "User created successfully. Please check your email to verify your account.",
            user: { _id: newUser._id, fullName, username, role: newUser.role }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { username, password, selectedRole } = req.body;

        // Find user
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "User not found" });

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        // Validate Role (Ensure an 'hr' person isn't logging into 'admin' portal)
        if (user.role !== selectedRole) {
            return res.status(403).json({ message: `Access denied. You are not an ${selectedRole}.` });
        }
// Only require verification for admin and hr
        if ((user.role === 'admin' || user.role === 'hr') && !user.isVerified) {
            return res.status(403).json({ message: "Please verify your email before logging in." });
        }

        // Create Token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '1h' });

        res.json({
  token,
  user: {
    _id: user._id,
    fullName: user.fullName,
    role: user.role
  }
});

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// VERIFY EMAIL
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const user = await User.findOne({ verificationToken: token });
        
        if (!user) {
            return res.status(400).send(`
                <div style="text-align: center; margin-top: 50px; font-family: Arial, sans-serif;">
                    <h1 style="color: red;">Invalid or Expired Verification Token</h1>
                    <p>Please try registering again or contact support.</p>
                </div>
            `);
        }
        
        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();
        
        res.send(`
            <div style="text-align: center; margin-top: 50px; font-family: Arial, sans-serif;">
                <h1 style="color: green;">Email Verified Successfully!</h1>
                <p>You can now go back to the application and log in.</p>
            </div>
        `);
    } catch (err) {
        res.status(500).send('<h1>Server Error</h1>');
    }
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            // We return a generic message to prevent email enumeration, but you could also throw an error if preferred
            return res.status(200).json({ message: "If an account with that email exists, a password reset link has been sent." });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now

        await user.save();

        // Send Email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // The exact URL to the frontend with the token
        const frontendUrl = 'http://localhost:5000/reset.html';
        const resetUrl = `${frontendUrl}#token=${resetToken}`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset Request - Employee Info Map',
            html: `<h1>Password Reset</h1>
                   <p>You requested a password reset. Please click the link below to set a new password.</p>
                   <br>
                   <a href="${resetUrl}" style="background-color: #2196F3; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
                   <br><br>
                   <p>If you did not request this, please ignore this email. The link will expire in 1 hour.</p>`
        });

        res.status(200).json({ message: "If an account with that email exists, a password reset link has been sent." });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ message: "Server error handling password reset request" });
    }
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        // Find user by token ensuring it hasn't expired
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Password reset token is invalid or has expired." });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        // Clear reset token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ 
            message: "Your password has been successfully reset! You can now log in.",
            role: user.role 
        });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ message: "Server error resetting password" });
    }
});

/* ================================
   GET ADMIN/STAFF PROFILE
================================ */
router.get('/profile/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const employee = await Employee.findOne({ userId: req.params.userId });
        if (!employee) return res.status(404).json({ message: "Employee record not found" });

        res.json({
            user: {
                _id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                role: user.role
            },
            employee: {
                empId: employee.empId,
                departmentInfo: employee.departmentInfo,
                personalInfo: employee.personalInfo,
                profilePhoto: employee.profilePhoto || null
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/* ================================
   UPDATE ADMIN/STAFF PROFILE
================================ */
router.put('/profile/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const { fullName, email, department, phone, address, profilePhoto } = req.body;

        // Update User collection
        const user = await User.findByIdAndUpdate(
            userId,
            {
                fullName: fullName || undefined,
                email: email || undefined
            },
            { new: true }
        );

        if (!user) return res.status(404).json({ message: "User not found" });

        // Update Employee collection
        const nameParts = (fullName || user.fullName || "").trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        const updateData = {
            departmentInfo: {
                firstName: firstName,
                lastName: lastName,
                department: department || undefined
            },
            personalInfo: {
                email: email || user.email,
                phone: phone || undefined,
                address1: address || undefined
            }
        };

        // Add profilePhoto if provided and validate size (max ~2MB for Base64)
        if (profilePhoto) {
            const photoSize = profilePhoto.length;
            const maxSize = 2 * 1024 * 1024; // 2MB in characters (roughly)
            
            if (photoSize > maxSize) {
                return res.status(400).json({ message: "Photo is too large. Maximum size is 2MB" });
            }
            updateData.profilePhoto = profilePhoto;
        }

        const employee = await Employee.findOneAndUpdate(
            { userId: userId },
            updateData,
            { new: true }
        );

        if (!employee) return res.status(404).json({ message: "Employee record not found" });

        res.json({
            message: "Profile updated successfully",
            user: user,
            employee: {
                empId: employee.empId,
                departmentInfo: employee.departmentInfo,
                personalInfo: employee.personalInfo,
                profilePhoto: employee.profilePhoto || null
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;