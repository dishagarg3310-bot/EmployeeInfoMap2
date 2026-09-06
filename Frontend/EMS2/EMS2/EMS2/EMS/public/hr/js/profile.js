function initHRProfile() {
  console.log("=== PROFILE PAGE LOADED ===");
  
  const editBtn = document.getElementById("editProfileBtn");
  const saveBtn = document.getElementById("saveProfileBtn");
  const image = document.getElementById("profileImage");
  const imageInput = document.getElementById("imageInput");
  const profileForm = document.getElementById("profileForm");

  if (!profileForm || !image) {
    console.log("HR profile page elements not found. Skipping profile initialization.");
    return;
  }

  console.log("DOM Elements found:", {
    editBtn: !!editBtn,
    saveBtn: !!saveBtn,
    image: !!image,
    imageInput: !!imageInput
  });

  const fields = document.querySelectorAll(
    "#profileForm input:not(#hrId):not(#username):not(#role), #profileForm textarea"
  );
  
  console.log("Form fields found:", fields.length);

  let currentHR = null;
  let photoChanged = false;

  // Get userId from localStorage or sessionStorage
  function getUserIdFromToken() {
    console.log("=== EXTRACTING USER ID ===");
    
    // Try localStorage first (Remember Me = true)
    let userData = localStorage.getItem("user");
    console.log("✓ Checking localStorage...", userData ? "FOUND" : "NOT FOUND");
    
    // If not in localStorage, try sessionStorage (Remember Me = false)
    if (!userData) {
      userData = sessionStorage.getItem("user");
      console.log("✓ Checking sessionStorage...", userData ? "FOUND" : "NOT FOUND");
    }
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log("✅ SUCCESS: User ID =", user._id);
        return user._id;
      } catch (err) {
        console.error("❌ Error parsing user data:", err);
      }
    }
    
    // Fallback: Try token from localStorage
    let token = localStorage.getItem("token");
    if (!token) {
      token = sessionStorage.getItem("token");
    }
    
    if (!token) {
      console.error("❌ CRITICAL: No token or user data found in storage!");
      console.error("❌ Please LOGIN first!");
      return null;
    }
    
    // Fallback: decode JWT (basic parsing)
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      const decoded = JSON.parse(jsonPayload);
      console.log("✅ Decoded ID from token:", decoded.id);
      return decoded.id;
    } catch (err) {
      console.error("❌ Error decoding token:", err);
      return null;
    }
  }

  // Load HR profile
  async function loadHRProfile() {
    console.log("\n=== LOADING HR PROFILE ===");
    const userId = getUserIdFromToken();
    
    if (!userId) {
      console.error("❌ FATAL: Cannot load profile - no userId available");
      console.error("❌ Did you login? Check if you can see login.html first");
      alert("❌ Unable to load profile. Please LOGIN FIRST!");
      return;
    }

    try {
      const apiUrl = `http://localhost:5000/api/auth/profile/${userId}`;
      console.log(`📡 Fetching from API: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      console.log(`✓ Response received - Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ API returned error:", errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to load profile`);
      }

      const data = await response.json();
      console.log("✅ DATA FROM BACKEND:", JSON.stringify(data, null, 2));
      currentHR = data;

      const user = data.user || {};
      const emp = data.employee || {};
      const p = emp.personalInfo || {};
      const d = emp.departmentInfo || {};

      console.log("\n=== PARSED DATA ===");
      console.log("User:", user);
      console.log("Employee:", emp);
      console.log("PersonalInfo:", p);
      console.log("DepartmentInfo:", d);

      console.log("\n=== POPULATING FORM ===");
      
      const hrIdField = document.getElementById("hrId");
      const usernameField = document.getElementById("username");
      const nameField = document.getElementById("name");
      const roleField = document.getElementById("role");
      const departmentField = document.getElementById("department");
      const contactField = document.getElementById("contact");
      const emailField = document.getElementById("email");
      const addressField = document.getElementById("address");

      const updates = {
        hrId: emp.empId || "N/A",
        username: user.username || "N/A",
        name: user.fullName || "",
        role: user.role === 'admin' ? 'Administrator' : user.role === 'hr' ? 'HR Personnel' : user.role || "N/A",
        department: d.department || "",
        contact: p.phone || "",
        email: p.email || user.email || "",
        address: p.address1 || ""
      };

      console.log("Updates to apply:", updates);

      if (hrIdField) { hrIdField.value = updates.hrId; console.log("✓ hrId set to:", updates.hrId); }
      if (usernameField) { usernameField.value = updates.username; console.log("✓ username set to:", updates.username); }
      if (nameField) { nameField.value = updates.name; console.log("✓ name set to:", updates.name); }
      if (roleField) { roleField.value = updates.role; console.log("✓ role set to:", updates.role); }
      if (departmentField) { departmentField.value = updates.department; console.log("✓ department set to:", updates.department); }
      if (contactField) { contactField.value = updates.contact; console.log("✓ contact set to:", updates.contact); }
      if (emailField) { emailField.value = updates.email; console.log("✓ email set to:", updates.email); }
      if (addressField) { addressField.value = updates.address; console.log("✓ address set to:", updates.address); }

      // Load profile photo if available
      if (emp.profilePhoto) {
        console.log("📸 Profile photo found in database!");
        console.log("Photo data size:", emp.profilePhoto.length, "characters");
        console.log("Photo format:", emp.profilePhoto.substring(0, 30));
        
        // Set image source
        image.src = emp.profilePhoto;
        console.log("✅ Image element src set to photo from DB");
        
        // Verify image loaded
        image.onload = () => {
          console.log("✅ Photo successfully loaded and displayed");
        };
        image.onerror = () => {
          console.error("❌ Failed to load photo - invalid Base64 data?");
        };
      } else {
        console.log("ℹ️ No profile photo stored in database yet");
        // Keep default image
      }

      // Keep fields disabled initially
      fields.forEach(field => field.disabled = true);
      if (editBtn) editBtn.style.display = "inline-block";
      if (saveBtn) saveBtn.style.display = "none";
      const cancelBtn = document.getElementById("cancelProfileBtn");
      if (cancelBtn) cancelBtn.style.display = "none";
      
      console.log("✅ PROFILE LOADED AND DISPLAYED SUCCESSFULLY");
    } catch (error) {
      console.error("❌ ERROR:", error);
      console.error("Stack:", error.stack);
      alert("❌ Error loading profile: " + error.message);
    }
  }

  // Enable edit mode
  if (editBtn) {
    editBtn.addEventListener("click", () => {
      console.log("✏️ Edit mode activated");
      fields.forEach(field => field.disabled = false);
      image.style.cursor = "pointer";
      editBtn.style.display = "none";
      saveBtn.style.display = "inline-block";
      const cancelBtn = document.getElementById("cancelProfileBtn");
      if (cancelBtn) cancelBtn.style.display = "inline-block";
    });
  }

  // Image click → open file picker
  if (image) {
    image.addEventListener("click", () => {
      console.log("Image clicked");
      if (imageInput) imageInput.click();
    });
  }

  if (imageInput) {
    imageInput.addEventListener("change", () => {
      const file = imageInput.files[0];
      if (!file) {
        console.log("No file selected");
        return;
      }

      console.log("📁 Image file selected:", {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Validate file size (must be < 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("❌ Image too large! Maximum 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        console.log("✅ File converted to Base64");
        console.log("Base64 length:", reader.result.length, "characters");
        console.log("First 100 chars:", reader.result.substring(0, 100));
        image.src = reader.result;
        photoChanged = true;
        console.log("📸 Preview image set (will be uploaded on Save)");
      };
      reader.onerror = () => {
        console.error("❌ Error reading file:", reader.error);
        alert("Error reading the image file");
      };
      reader.readAsDataURL(file);
    });
  }

  // Save profile
  if (saveBtn) {
    saveBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      console.log("\n=== SAVING PROFILE ===");

      const userId = getUserIdFromToken();
      if (!userId) {
        alert("❌ Session expired. Please login again.");
        return;
      }

      try {
        const updateData = {
          fullName: document.getElementById("name").value,
          email: document.getElementById("email").value,
          department: document.getElementById("department").value,
          phone: document.getElementById("contact").value,
          address: document.getElementById("address").value
        };

        console.log("Data to update:", updateData);

        // Add photo if it was changed
        if (photoChanged) {
          console.log("📸 Photo was changed - checking if it's a valid data URL");
          if (image.src && image.src.startsWith('data:')) {
            console.log("✅ Valid Base64 data URL detected");
            console.log("Photo size:", image.src.length, "characters");
            if (image.src.length > 2 * 1024 * 1024) {
              alert("❌ Photo is too large! Maximum 2MB.");
              return;
            }
            updateData.profilePhoto = image.src;
            console.log("✅ Photo added to updateData");
          } else {
            console.warn("⚠️ Photo was marked as changed but no valid data URL found");
            console.log("Current image.src:", image.src ? image.src.substring(0, 50) : "empty");
          }
        } else {
          console.log("ℹ️ No photo changes");
        }

        console.log("📤 Sending update request to server...");
        console.log("Total data size:", JSON.stringify(updateData).length, "characters");

        const response = await fetch(`http://localhost:5000/api/auth/profile/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData)
        });

        console.log("Update response status:", response.status, response.statusText);

        if (!response.ok) {
          const error = await response.json();
          console.error("❌ Server error:", error);
          throw new Error(error.message || "Failed to update profile");
        }

        const result = await response.json();
        console.log("✅ Profile updated successfully");
        console.log("Response data:", result);
        currentHR = result;

        // Verify photo was saved in response
        if (result.employee?.profilePhoto) {
          console.log("✅ Photo confirmed saved in database");
          console.log("Stored photo size:", result.employee.profilePhoto.length, "characters");
          localStorage.setItem("profilePhoto", result.employee.profilePhoto);
          sessionStorage.setItem("profilePhoto", result.employee.profilePhoto);

          const topbarImg = document.getElementById("topbarProfilePic");
          if (topbarImg) {
            topbarImg.src = result.employee.profilePhoto;
          }
        } else {
          console.log("ℹ️ No photo in response (may not have uploaded one)");
        }

        // Update localStorage user data (if using Remember Me)
        let userData = JSON.parse(localStorage.getItem("user") || "{}");
        if (Object.keys(userData).length > 0) {
          userData.fullName = result.user.fullName;
          localStorage.setItem("user", JSON.stringify(userData));
        }
        
        // Also update sessionStorage user data (if not using Remember Me)
        userData = JSON.parse(sessionStorage.getItem("user") || "{}");
        if (Object.keys(userData).length > 0) {
          userData.fullName = result.user.fullName;
          sessionStorage.setItem("user", JSON.stringify(userData));
        }

        alert("✓ Profile updated successfully!");
        
        // Refresh topbar profile photo if function exists
        if (typeof loadTopbarProfilePhoto === 'function') {
          console.log("🔄 Refreshing topbar profile photo...");
          loadTopbarProfilePhoto();
        }
        
        // Disable fields again
        fields.forEach(field => field.disabled = true);
        editBtn.style.display = "inline-block";
        saveBtn.style.display = "none";
        const cancelBtn = document.getElementById("cancelProfileBtn");
        if (cancelBtn) cancelBtn.style.display = "none";
        photoChanged = false;
      } catch (error) {
        console.error("❌ Error updating profile:", error);
        console.error("Stack trace:", error.stack);
        alert("❌ Error updating profile: " + error.message);
      }
    });
  }

  // Cancel button - revert to view mode
  const cancelBtn = document.getElementById("cancelProfileBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      console.log("❌ Edit cancelled - reverting to view mode");
      // Reload profile to revert any unsaved changes
      loadHRProfile();
      fields.forEach(field => field.disabled = true);
      editBtn.style.display = "inline-block";
      saveBtn.style.display = "none";
      cancelBtn.style.display = "none";
      photoChanged = false;
    });
  }

  // Load profile on page init
  loadHRProfile();
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHRProfile);
} else {
  initHRProfile();
}
