const CONFIG = {
    roles: {
        admin: {
            title: 'Administrator',
            hint: 'Full system access with administrative privileges',
            gradient: 'gradient-blue'
        },
        hr: {
            title: 'HR Personnel',
            hint: 'Access to employee records and HR functions',
            gradient: 'gradient-purple'
        },
        user: {
            title: 'Faculty',
            hint: 'Faculty access to academic and profile information',
            gradient: 'gradient-teal'
        }
    }
};

let currentRole = null;
let attempts = 0;
let signupData = null;

function selectRole(role) {
    currentRole = role;
    const roleData = CONFIG.roles[role];
    document.getElementById('roleSelection').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('headerSubtitle').textContent = roleData.title + ' Portal';
    document.getElementById('roleTitle').textContent = roleData.title;
    document.getElementById('roleHint').textContent = roleData.hint;
    document.getElementById('cardHeader').className = 'card-header ' + roleData.gradient;
    document.getElementById('loginForm').reset();
    attempts = 0;
    attempts = 0;

    const signupSection = document.getElementById("signupSection");

    if (role === "user") {
        signupSection.style.display = "none";
    } else {
        signupSection.style.display = "block";
    }
}

function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.textContent = input.type === 'password' ? '👁️' : '🙈';
}

function showToast(message, type) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✅' : '❌'}</span>
        <p style="flex:1; margin:0">${message}</p>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (password.length < minLength) {
        return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!hasUpperCase) {
        return { valid: false, message: 'Password must contain at least one uppercase letter (A-Z)' };
    }
    if (!hasLowerCase) {
        return { valid: false, message: 'Password must contain at least one lowercase letter (a-z)' };
    }
    if (!hasNumber) {
        return { valid: false, message: 'Password must contain at least one number (0-9)' };
    }
    if (!hasSpecialChar) {
        return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*...)' };
    }
    return { valid: true, message: '✓ Strong password!' };
}

function validateEmail(email) {
    return email.toLowerCase().endsWith('@gmail.com');
}

function validateUsername(username) {
    return username === username.toLowerCase() && /^[a-z0-9_]+$/.test(username);
}

function validateDepartment(department, role) {
    if (role === 'admin') {
        return department === 'Academic Administration';
    } else if (role === 'hr') {
        return department === 'Human Resources';
    }
    return true;
}

function validatePhone(phone) {
    // Remove spaces for validation
    const phoneDigitsOnly = phone.replace(/\D/g, '');
    
    // Check if it starts with +91 (country code) and has 10 digits after
    if (!phone.startsWith('+91')) {
        return { valid: false, message: 'Phone number must start with +91' };
    }
    
    // Should be +91 followed by 10 digits
    if (phoneDigitsOnly.length !== 12 || phoneDigitsOnly !== '91' + phoneDigitsOnly.slice(2)) {
        return { valid: false, message: 'Phone number must have +91 followed by 10 digits' };
    }
    
    return { valid: true, message: '✓ Valid phone number' };
}

// Real-time password validation
document.addEventListener('DOMContentLoaded', function() {

    // Check for auto-select role after password reset
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role');
    if (roleParam && CONFIG.roles[roleParam]) {
        // Remove the query param from URL so it doesn't stay there if they refresh
        window.history.replaceState({}, document.title, window.location.pathname);
        selectRole(roleParam);
    }

    const createPasswordInput = document.getElementById('createPassword');
    if (createPasswordInput) {
        createPasswordInput.addEventListener('input', function(e) {
            const password = e.target.value;
            const strengthDiv = document.getElementById('passwordStrength');
            
            if (password.length === 0) {
                strengthDiv.classList.add('hidden');
                return;
            }
            
            const validation = validatePassword(password);
            strengthDiv.classList.remove('hidden');
            strengthDiv.className = 'password-strength ' + (validation.valid ? 'strong' : 'weak');
            strengthDiv.textContent = validation.message;
        });
    }

    // Real-time confirm password validation
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function(e) {
            const password = document.getElementById('createPassword').value;
            const confirm = e.target.value;
            const errorDiv = document.getElementById('confirmError');
            
            if (confirm.length === 0) {
                errorDiv.classList.add('hidden');
                return;
            }
            
            if (password !== confirm) {
                errorDiv.classList.remove('hidden');
                errorDiv.textContent = 'Passwords do not match';
            } else {
                errorDiv.classList.add('hidden');
            }
        });
    }

    // Real-time phone number validation and formatting
    const phoneInput = document.getElementById('signupPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value;
            
            // Remove all non-digits except +
            let cleaned = value.replace(/[^\d+]/g, '');
            
            // If user hasn't typed +91, add it automatically
            if (!cleaned.startsWith('+91')) {
                // Remove any leading 91 without +
                if (cleaned.startsWith('91')) {
                    cleaned = '+' + cleaned;
                } else {
                    // Remove any existing digits and start fresh with +91
                    cleaned = '+91' + cleaned.replace(/\D/g, '');
                }
            }
            
            // Limit to +91 and 10 digits after (total 13 characters: +91 + 10 digits)
            if (cleaned.length > 13) {
                cleaned = cleaned.substring(0, 13);
            }
            
            // Format display: +91 9876543210
            let formatted = cleaned;
            if (cleaned.length > 3) {
                formatted = cleaned.substring(0, 3) + ' ' + cleaned.substring(3);
            }
            
            e.target.value = formatted;
            
            // Real-time validation
            const phoneError = document.getElementById('phoneError');
            if (value.trim().length === 0) {
                phoneError.classList.add('hidden');
            } else {
                const validation = validatePhone(e.target.value);
                if (validation.valid) {
                    phoneError.classList.add('hidden');
                } else {
                    phoneError.classList.remove('hidden');
                    phoneError.textContent = validation.message;
                }
            }
        });
    }
});

async function handleSignup(event) {
    event.preventDefault();
    if (signupData) return;
    signupData = true;
    console.log("Attempting to signup with role:", currentRole);
    const fullName = document.getElementById('fullName').value.trim();
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('createPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Optional fields for admin/hr
    const department = document.getElementById('signupDepartment')?.value.trim() || '';
    const phone = document.getElementById('signupPhone')?.value.trim() || '';
    const address = document.getElementById('signupAddress')?.value.trim() || '';

    // Validate username
    if (!validateUsername(username)) {
        showToast('Username must be lowercase letters, numbers, and underscores only', 'error');
        return;
    }

    // Validate email
    if (!validateEmail(email)) {
        showToast('Email must be a valid @gmail.com address', 'error');
        return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        showToast(passwordValidation.message, 'error');
        return;
    }

    // Validate password match
    if (password !== confirmPassword) {
        showToast('Passwords do not match!', 'error');
        return;
    }

    // Additional validation for admin/hr
    if (currentRole === 'admin' || currentRole === 'hr') {
        // Validate department
        if (!department) {
            showToast('Department is required', 'error');
            return;
        }

        if (!validateDepartment(department, currentRole)) {
            if (currentRole === 'admin') {
                showToast('Admin must select "Academic Administration"', 'error');
            } else {
                showToast('HR must select "Human Resources"', 'error');
            }
            return;
        }

        // Validate phone
        if (!phone) {
            showToast('Contact Number is required', 'error');
            return;
        }

        const phoneValidation = validatePhone(phone);
        if (!phoneValidation.valid) {
            showToast(phoneValidation.message, 'error');
            return;
        }
    }

    try {
        const signupPayload = { 
            fullName, 
            username, 
            email, 
            password,
            role: currentRole
        };

        // Add optional fields for admin/hr
        if (currentRole === 'admin' || currentRole === 'hr') {
            signupPayload.department = department;
            signupPayload.phone = phone;
            signupPayload.address = address;
        }

        const response = await fetch('http://localhost:5000/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(signupPayload)
        });

        const data = await response.json();

        if (response.ok) {
            showToast(data.message || 'Account created successfully! Please check your email to verify.', 'success');
            
            setTimeout(() => {
                closeSignupModal();
                document.getElementById('signupForm').reset();
                const strengthDiv = document.getElementById('passwordStrength');
                if (strengthDiv) strengthDiv.classList.add('hidden');
            }, 1500);
        } else {
            // Show the error coming from the server (e.g., "User already exists")
            showToast(data.message || 'Signup failed', 'error');
        }
    } catch (error) {
        console.error(error);
        showToast('Server error. Is the backend running?', 'error');
    }
    finally {
    signupData = false;
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    // 1. Check for too many failed attempts locally
    if (attempts >= 3) {
        showToast('Account locked. Too many failed attempts.', 'error');
        return;
    }

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const btn = document.getElementById('loginBtn');
    const rememberMe = document.getElementById('rememberMe').checked;


    // 2. Ensure a role (Admin/HR/User) was actually selected
    if (!currentRole) {
        showToast('Error: No role selected. Please go back and select a role.', 'error');
        return;
    }

    // 3. UI: Disable button and show loading text
    btn.disabled = true;
    btn.innerHTML = '🔄 Authenticating...';

    try {
        // 4. Send credentials + selected role to Backend
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username: username, 
                password: password,
                selectedRole: currentRole, // IMPORTANT: Checks if user is allowed in this portal
                rememberMe: rememberMe
            })
        });

        const data = await response.json();

        if (response.ok) {
            // --- SUCCESS ---
            showToast(`Login successful! Welcome ${data.user.fullName}`, 'success');
            attempts = 0; // Reset attempts on success

            // Save the "Access Token" and User Info in the browser
            const userInfo = {
                _id: data.user._id,
                fullName: data.user.fullName,
                role: data.user.role
            };

            if (rememberMe) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(userInfo));
            } else {
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('user', JSON.stringify(userInfo));
            }


            // Redirect to the correct Dashboard after 1.5 seconds
            setTimeout(() => {
                if (data.user.role === 'admin') {
                    window.location.href = '/admin/index.html'; // Make sure this file exists!
                } else if (data.user.role === 'hr') {
                    window.location.href = '/hr/index.html';    // Make sure this file exists!
                } else {
                    window.location.href = '/user/index.html';  // Make sure this file exists!
                }
            }, 1500);

        } else {
            // --- FAILED ---
            attempts++;
            const remaining = 3 - attempts;
            
            // Show the specific error from backend (e.g., "User not found" or "Access Denied")
            showToast(data.message || 'Login failed', 'error');
            
            if (remaining > 0) {
                showToast(`${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`, 'error');
            }
        }

    } catch (error) {
        console.error('Login Error:', error);
        showToast('Server error. Is the backend running?', 'error');
    } finally {
        // 5. Reset button state
        btn.disabled = false;
        btn.innerHTML = '🔐 Sign In';
    }
}
function openSignupModal() {
    document.getElementById('signupModal').classList.remove('hidden');
    
    // Show/hide admin/hr fields based on current role
    const adminHrFields = document.getElementById('adminHrFields');
    if (currentRole === 'admin' || currentRole === 'hr') {
        adminHrFields.style.display = 'block';
    } else {
        adminHrFields.style.display = 'none';
    }
}

function closeSignupModal() {
    document.getElementById('signupModal').classList.add('hidden');
    document.getElementById('signupForm').reset();
    const strengthDiv = document.getElementById('passwordStrength');
    const confirmError = document.getElementById('confirmError');
    if (strengthDiv) strengthDiv.classList.add('hidden');
    if (confirmError) confirmError.classList.add('hidden');
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSignupModal();
});
function goBack() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('roleSelection').classList.remove('hidden');
    document.getElementById('headerSubtitle').textContent =
        'Empowering Excellence Through Education';

    currentRole = null;
    attempts = 0;
    document.getElementById('loginForm').reset();
}

// FORGOT PASSWORD FUNCTIONS
function openForgotPasswordModal() {
    document.getElementById('forgotPasswordModal').classList.remove('hidden');
}

function closeForgotPasswordModal() {
    document.getElementById('forgotPasswordModal').classList.add('hidden');
    document.getElementById('forgotPasswordForm').reset();
}

async function handleForgotPassword(event) {
    event.preventDefault();
    const email = document.getElementById('forgotEmail').value.trim();
    const btn = document.getElementById('forgotBtn');
    
    if (!validateEmail(email)) {
        showToast('Email must be a valid @gmail.com address', 'error');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '⏳ Sending...';

    try {
        const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await response.json();

        if (response.ok) {
            showToast(data.message, 'success');
            setTimeout(closeForgotPasswordModal, 2000);
        } else {
            showToast(data.message || 'Error requesting password reset', 'error');
        }
    } catch (error) {
        console.error(error);
        showToast('Server error. Is the backend running?', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '📧 Send Reset Link';
    }
}