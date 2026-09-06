(function initEmployeeId() {

    const container = document.getElementById("idcard-container");

    const userStr =
        localStorage.getItem("user") || sessionStorage.getItem("user");

    if (!userStr) {
        showError("You are not logged in. Please login again.");
        return;
    }

    const user   = JSON.parse(userStr);
    const userId = user._id || user.id;

    if (!userId) {
        showError("User ID not found. Please login again.");
        return;
    }

    async function loadIdCard() {
        try {
            const res = await fetch(`http://localhost:5000/api/employees/me/${userId}`);
            if (!res.ok) { showNotGenerated(); return; }

            const emp = await res.json();
            if (!emp.idCardGenerated || !emp.idCardData) { showNotGenerated(); return; }

            renderCard(emp.idCardData, emp);
        } catch (err) {
            console.error("Error loading ID card:", err);
            showError("Failed to load ID card. Please try again later.");
        }
    }

    function renderCard(card, emp) {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent("http://localhost:5000/qr-verify.html?empId=" + card.empId)}`;
        const profilePhoto = emp?.profilePhoto || "https://i.pravatar.cc/150?img=47";

        container.innerHTML = `
            <div class="user-idcard-wrapper">
                <div class="user-idcard" id="idcard-print-area">
                    <div class="user-idcard-header">
                        <h3>Employee Identity Card</h3>
                    </div>
                    <div class="user-idcard-body">
                        <div class="user-idcard-left">
                            <img src="${profilePhoto}" alt="Employee Photo" class="user-photo-placeholder">
                        </div>
                        <div class="user-idcard-right">
                            <div class="user-idcard-info">
                                <p><strong>Name:</strong> ${card.firstName} ${card.lastName}</p>
                                <p><strong>ID:</strong> ${card.empId}</p>
                                <p><strong>Department:</strong> ${card.department || "N/A"}</p>
                                <p><strong>Designation:</strong> ${card.designation || "N/A"}</p>
                            </div>
                            <div class="user-qr-placeholder">
                                <img src="${qrUrl}" alt="QR Code" width="100" height="100" crossorigin="anonymous" />
                            </div>
                        </div>
                    </div>
                    <div class="user-idcard-footer">
                        <span>Authorized Signature</span>
                    </div>
                </div>
                <div class="user-idcard-actions">
                    <button class="btn-download-pdf" id="downloadPdfBtn">⬇ Download PDF</button>
                </div>
            </div>
        `;

        document.getElementById("downloadPdfBtn").onclick = () => downloadPDF(card.empId);
    }

    function showNotGenerated() {
        container.innerHTML = `
            <div class="idcard-status">
                <div class="status-icon">🪪</div>
                <p>Your ID card has not been generated yet.</p>
                <p style="font-size:12px; margin-top:6px; color:#999">Please contact your administrator.</p>
            </div>
        `;
    }

    function showError(msg) {
        container.innerHTML = `
            <div class="idcard-status">
                <div class="status-icon">⚠️</div>
                <p>${msg}</p>
            </div>
        `;
    }

    function downloadPDF(empId) {
        if (!window.html2pdf) {
            const script = document.createElement("script");
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
            script.onload = () => doPDF(empId);
            document.head.appendChild(script);
        } else {
            doPDF(empId);
        }
    }

    function doPDF(empId) {
        const element = document.getElementById("idcard-print-area");

        const opt = {
            margin: 0.2,
            filename: `ID_Card_${empId}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                scrollX: 0,
                scrollY: -window.scrollY
            },
            jsPDF: {
                unit: "in",
                format: [5, 3.2],
                orientation: "landscape"
            }
        };

        html2pdf().set(opt).from(element).save();
    }

    loadIdCard();

})();