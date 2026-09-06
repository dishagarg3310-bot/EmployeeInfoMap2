(function () {

    // URL se empId lo
    const params = new URLSearchParams(window.location.search);
    const empId  = params.get("empId");

    const passwordScreen = document.getElementById("passwordScreen");
    const detailsScreen  = document.getElementById("detailsScreen");
    const empIdDisplay   = document.getElementById("empIdDisplay");
    const passwordInput  = document.getElementById("passwordInput");
    const verifyBtn      = document.getElementById("verifyBtn");
    const errorMsg       = document.getElementById("errorMsg");

    // EmpId nahi mila
    if (!empId) {
        empIdDisplay.textContent = "Invalid QR Code";
        verifyBtn.disabled = true;
        return;
    }

    empIdDisplay.textContent = `Employee ID: ${empId}`;

    // Enter key se bhi verify ho
    passwordInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") verifyPassword();
    });

    verifyBtn.addEventListener("click", verifyPassword);

    /* ================================
       Verify Password
    ================================ */
    async function verifyPassword() {
        const password = passwordInput.value.trim();

        if (!password) {
            showError("Please enter your password.");
            return;
        }

        verifyBtn.disabled = true;
        verifyBtn.textContent = "Verifying...";
        hideError();

        try {
            const res  = await fetch("http://localhost:5000/api/employees/verify-qr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ empId, password })
            });

            const data = await res.json();

            if (!res.ok) {
                showError(data.message || "Incorrect password. Please try again.");
                verifyBtn.disabled = false;
                verifyBtn.textContent = "Verify →";
                return;
            }

            // Success → show details
            showDetails(data.employee);

        } catch (err) {
            console.error(err);
            showError("Server error. Please try again.");
            verifyBtn.disabled = false;
            verifyBtn.textContent = "Verify →";
        }
    }

    /* ================================
       Show Employee Details
    ================================ */
    function showDetails(emp) {
        passwordScreen.style.display = "none";
        detailsScreen.style.display  = "block";

        document.getElementById("detailsEmpId").textContent = `Employee ID: ${emp.empId}`;

        const dept     = emp.departmentInfo || {};
        const personal = emp.personalInfo   || {};

        // Department Info
        const deptFields = [
            { label: "First Name",        value: dept.firstName },
            { label: "Middle Name",       value: dept.middleName },
            { label: "Last Name",         value: dept.lastName },
            { label: "Department",        value: dept.department },
            { label: "Designation",       value: dept.designation },
            { label: "Joining Date",      value: dept.joiningDate },
            { label: "Present App. Date", value: dept.presentAppDate },
            { label: "Pay Scale",         value: dept.payScale },
        ];

        // Personal Info
        const personalFields = [
            { label: "Father's Name",  value: personal.fatherName },
            { label: "Mother's Name",  value: personal.motherName },
            { label: "Gender",         value: personal.gender },
            { label: "Marital Status", value: personal.maritalStatus },
            { label: "Spouse Name",    value: personal.spouseName },
            { label: "Email",          value: personal.email },
            { label: "Phone",          value: personal.phone },
            { label: "Address 1",      value: personal.address1 },
            { label: "Address 2",      value: personal.address2 },
            { label: "City",           value: personal.city },
            { label: "State",          value: personal.state },
            { label: "Pincode",        value: personal.pincode },
            { label: "Category",       value: personal.category },
            { label: "Mother Tongue",  value: personal.motherTongue },
        ];

        renderGrid("deptGrid",     deptFields);
        renderGrid("personalGrid", personalFields);
    }

    function renderGrid(gridId, fields) {
        const grid = document.getElementById(gridId);
        grid.innerHTML = "";

        fields.forEach(({ label, value }) => {
            const item = document.createElement("div");
            item.className = "detail-item";

            const isEmpty = !value || value.toString().trim() === "";

            item.innerHTML = `
                <span class="detail-label">${label}</span>
                <span class="detail-value ${isEmpty ? "empty" : ""}">${isEmpty ? "Not provided" : value}</span>
            `;

            grid.appendChild(item);
        });
    }

    /* ================================
       Error Helpers
    ================================ */
    function showError(msg) {
        errorMsg.textContent    = msg;
        errorMsg.style.display  = "block";
    }

    function hideError() {
        errorMsg.style.display = "none";
    }

})();