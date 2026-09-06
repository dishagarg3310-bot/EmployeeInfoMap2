function initEmployeeIdCard() {

    const employeeList = document.getElementById("employeeList");
    const searchInput  = document.getElementById("searchInput");

    let employees = [];

    async function loadEmployees() {
        try {
            const res  = await fetch("http://localhost:5000/api/employees?role=user");
            const data = await res.json();
            employees  = data.filter(emp => emp.status === "active");
            renderList(employees);
        } catch (err) {
            console.error("Failed to load employees", err);
        }
    }

    function renderList(list) {
        employeeList.innerHTML = "";

        if (list.length === 0) {
            employeeList.innerHTML = "<p style='padding:12px'>No employees found</p>";
            return;
        }

        list.forEach(emp => {
            const row = document.createElement("div");
            row.className = "employee-row";

            const first    = emp.departmentInfo?.firstName || "";
            const last     = emp.departmentInfo?.lastName  || "";
            const fullName = `${first} ${last}`.trim();
            const isGenerated = emp.idCardGenerated;

            row.innerHTML = `
                <span>${emp.empId}</span>
                <span>${fullName}</span>
                <span>
                    ${isGenerated
                        ? `<button class="btn-view">View ID Card</button>`
                        : `<button class="btn-generate">Generate ID Card</button>`
                    }
                </span>
            `;

            if (isGenerated) {
                row.querySelector(".btn-view").onclick = () => renderIdCard(emp.idCardData, emp);
            } else {
                row.querySelector(".btn-generate").onclick = () => generateCard(emp);
            }

            employeeList.appendChild(row);
        });
    }

    searchInput.addEventListener("input", () => {
        const value = searchInput.value.toLowerCase();
        const filtered = employees.filter(emp => {
            const name = `${emp.departmentInfo?.firstName || ""} ${emp.departmentInfo?.lastName || ""}`.toLowerCase();
            return emp.empId.toLowerCase().includes(value) || name.includes(value);
        });
        renderList(filtered);
    });

    async function generateCard(emp) {
        try {
            const res  = await fetch(`http://localhost:5000/api/employees/admin/idcard/${emp.empId}`, {
                method: "POST"
            });
            const data = await res.json();

            if (!res.ok) {
                alert(data.message || "Failed to generate ID card");
                return;
            }

            const index = employees.findIndex(e => e.empId === emp.empId);
            if (index !== -1) {
                employees[index].idCardGenerated = true;
                employees[index].idCardData      = data.card;
            }

            renderList(employees);
            renderIdCard(data.card, emp);
            // 🔥 ADD THIS (ACTIVITY LOG)
const first = emp.departmentInfo?.firstName || "";
const last  = emp.departmentInfo?.lastName || "";
const fullName = `${first} ${last}`.trim();

await fetch("/api/dashboard/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        text: `ID Card generated for ${fullName}`
    })
});


        } catch (err) {
            console.error("Generate error:", err);
            alert("Server error. Please try again.");
        }
    }

    function renderIdCard(card, emp) {
        removeIdCard();

        const first = card?.firstName  || emp?.departmentInfo?.firstName || "";
        const last  = card?.lastName   || emp?.departmentInfo?.lastName  || "";
        const empId = card?.empId      || emp?.empId || "";
        const dept  = card?.department || emp?.departmentInfo?.department  || "N/A";
        const desig = card?.designation|| emp?.departmentInfo?.designation || "N/A";
        const qrData = card?.qrData    || `EMPLOYEE:${empId}`;
        const profilePhoto = emp?.profilePhoto || "https://i.pravatar.cc/150?img=47";

        // QR code URL using Google Charts API

        // NAYA
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent("http://localhost:5000/qr-verify.html?empId=" + empId)}`;
        // Overlay
        const overlay = document.createElement("div");
        overlay.id = "idcard-overlay";
        overlay.className = "idcard-overlay";

        overlay.innerHTML = `
            <div class="idcard-wrapper" id="generated-idcard">
                <div class="idcard-header">
                    <h3>Employee Identity Card</h3>
                    <span class="close-idcard">&times;</span>
                </div>

                <div class="idcard-body">
                    <div class="idcard-left">
                        <img src="${profilePhoto}" alt="Employee Photo" class="photo-placeholder">
                    </div>

                    <div class="idcard-right">
                        <div class="idcard-info">
                            <p><strong>Name:</strong> ${first} ${last}</p>
                            <p><strong>ID:</strong> ${empId}</p>
                            <p><strong>Department:</strong> ${dept}</p>
                            <p><strong>Designation:</strong> ${desig}</p>
                        </div>
                        <div class="qr-placeholder">
                            <img src="${qrUrl}" alt="QR Code" width="100" height="100" />
                        </div>
                    </div>
                </div>

                <div class="idcard-footer">
                    <span>Authorized Signature</span>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Close on X
        overlay.querySelector(".close-idcard").onclick = removeIdCard;

        // Close on overlay click (outside card)
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) removeIdCard();
        });
    }

    function removeIdCard() {
        const old = document.getElementById("idcard-overlay");
        if (old) old.remove();
    }

    loadEmployees();
}