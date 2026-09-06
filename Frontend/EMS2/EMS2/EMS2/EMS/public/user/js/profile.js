console.log("PROFILE.JS LOADED");

// Phone validation and formatting function
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

// Show toast notification
function showToast(message, type) {
    const container = document.getElementById('toastContainer') || createToastContainer();
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

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
    `;
    document.body.appendChild(container);
    return container;
}

// ------------------ TAB SWITCH ------------------
function showTab(tabId, element) {
  document.querySelectorAll(".tab-content")
    .forEach(c => c.classList.remove("active"));

  document.getElementById(tabId).classList.add("active");

  document.querySelectorAll(".profile-tabs .tab")
    .forEach(t => t.classList.remove("active"));

  element.classList.add("active");
}

// 🔥 RUN IMMEDIATELY (DOM IS ALREADY READY)
initProfile();

function initProfile() {
  console.log("INIT PROFILE RUNNING");

  const user =
  JSON.parse(localStorage.getItem("user")) ||
  JSON.parse(sessionStorage.getItem("user"));

  if (!user || !user._id) {
    alert("Not logged in");
    return;
  }

  const userId = user._id;

  // DOM elements
  const empID = document.getElementById("empID");
  const empFName = document.getElementById("empFName");
  const empMName = document.getElementById("empMName");
  const empLName = document.getElementById("empLName");
  const empDept = document.getElementById("empDept");
  const empDesignation = document.getElementById("empDesignation");
  const empJoinDate = document.getElementById("empJoinDate");
  const empPresentAppDate = document.getElementById("empPresentAppDate");
  const empPayScale = document.getElementById("empPayScale");

  const empFatherName = document.getElementById("empFatherName");
  const empMotherName = document.getElementById("empMotherName");
  const empGender = document.getElementById("empGender");
  const empEmail = document.getElementById("empEmail");
  const empPhone = document.getElementById("empPhone");
  const empMaritalStatus = document.getElementById("empMaritalStatus");
  const empSpouseName = document.getElementById("empSpouseName");
  const empAddress1 = document.getElementById("empAddress1");
  const empAddress2 = document.getElementById("empAddress2");
  const empMotherTongue = document.getElementById("empMotherTongue");
  const empCategory = document.getElementById("empCategory");
  const empCity = document.getElementById("empCity");
  const empState = document.getElementById("empState");
  const empPincode = document.getElementById("empPincode");

  const saveBtn = document.getElementById("saveProfileBtn");
  const uploadPhotoBtn = document.getElementById("uploadPhotoBtn");
  const photoUpload = document.getElementById("photoUpload");
  const profilePic = document.getElementById("profilePic");

  console.log("FETCHING PROFILE…");

  fetch(`http://localhost:5000/api/employees/me/${userId}`)
    .then(res => {
      if (!res.ok) {
        throw new Error(`Failed to fetch profile: ${res.status}`);
      }
      return res.json();
    })
    .then(emp => {
      console.log("EMPLOYEE DATA:", emp);

      const d = emp.departmentInfo || {};
      const p = emp.personalInfo || {};

      document.getElementById("empFullName").textContent =
        `${d.firstName || ""} ${d.lastName || ""}`.trim();

      document.getElementById("empDesignationHeader").textContent =
        d.designation || "";

      // Display profile photo if available
      if (emp.profilePhoto) {
        profilePic.src = emp.profilePhoto;
        // Update localStorage with fresh data
        localStorage.setItem("profilePhoto", emp.profilePhoto);
        console.log("Profile photo loaded from database");
      } else {
        profilePic.src = "https://i.pravatar.cc/150?img=47";
      }

      empID.value = emp.empId || "";
      empFName.value = d.firstName || "";
      empMName.value = d.middleName || "";
      empLName.value = d.lastName || "";
      empDept.value = d.department || "";
      empDesignation.value = d.designation || "";
      empJoinDate.value = d.joiningDate || "";
      empPresentAppDate.value = d.presentAppDate || "";
      empPayScale.value = d.payScale || "";

      empFatherName.value = p.fatherName || "";
      empMotherName.value = p.motherName || "";
      empGender.value = p.gender || "";
      empEmail.value = p.email || "";
      empPhone.value = p.phone || "";
      empMaritalStatus.value = p.maritalStatus || "";
      empSpouseName.value = p.spouseName || "";
      empAddress1.value = p.address1 || "";
      empAddress2.value = p.address2 || "";
      empMotherTongue.value = p.motherTongue || "";
      empCategory.value = p.category || "";
      empCity.value = p.city || "";
      empState.value = p.state || "";
      empPincode.value = p.pincode || "";

      // Add phone number formatting event listener
      empPhone.addEventListener('input', function(e) {
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
    })
    .catch(err => {
      console.error("Error loading profile:", err);
      alert("Error loading profile. Please refresh the page.");
    });

  saveBtn.onclick = () => {
    // Validate phone number if provided
    const phone = empPhone.value.trim();
    if (phone) {
      const phoneValidation = validatePhone(phone);
      if (!phoneValidation.valid) {
        showToast(phoneValidation.message, 'error');
        return;
      }
    }

    const payload = {
      fatherName: empFatherName.value,
      motherName: empMotherName.value,
      gender: empGender.value,
      email: empEmail.value,
      phone: phone,
      maritalStatus: empMaritalStatus.value,
      spouseName: empSpouseName.value,
      address1: empAddress1.value,
      address2: empAddress2.value,
      motherTongue: empMotherTongue.value,
      category: empCategory.value,
      city: empCity.value,
      state: empState.value,
      pincode: empPincode.value
    };

    fetch(`http://localhost:5000/api/employees/me/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.message && data.message.includes('already registered')) {
          showToast(data.message, 'error');
        } else {
          showToast('Profile updated successfully', 'success');
        }
      })
      .catch(err => {
        showToast('Error updating profile: ' + err.message, 'error');
      });
  };

  // Photo Upload Handler
  uploadPhotoBtn.onclick = () => {
    photoUpload.click();
  };

  photoUpload.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Photo = event.target.result;
      profilePic.src = base64Photo;

      // Save to database
      fetch(`http://localhost:5000/api/employees/me/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilePhoto: base64Photo })
      })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          console.log("Photo saved successfully:", data);
          alert("Profile photo updated successfully");
          // Update topbar profile pic
          updateTopbarProfilePic(base64Photo);
          // Clear old localStorage cache and set new one
          localStorage.removeItem("profilePhoto");
          localStorage.setItem("profilePhoto", base64Photo);
        })
        .catch(err => {
          console.error("Error uploading photo:", err);
          alert("Error uploading photo. Please try again.");
          // Revert image to previous state
          location.reload();
        });
    };
    reader.readAsDataURL(file);
  };
}

function updateTopbarProfilePic(photoData) {
  const topbarImg = document.getElementById("topbarProfilePic") || document.querySelector(".topbar-right .profile-pic");
  if (topbarImg) {
    topbarImg.src = photoData;
    localStorage.setItem("profilePhoto", photoData);
  }
}
