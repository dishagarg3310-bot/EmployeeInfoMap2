(function adminAuthGuard() {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const userStr =
    localStorage.getItem("user") ||
    sessionStorage.getItem("user");

  if (!token || !userStr) {
    window.location.replace("/index.html");
    return;
  }

  const user = JSON.parse(userStr);

  if (user.role !== "admin") {
    window.location.replace("/index.html");
  }
})();

const ROLE = "admin";
const RECENT_KEY = `${ROLE}_recentPages`;

const ROUTES = {
    home: "Home",
    dashboard: "My Dashboard",
    profile: "My Profile",
    attendance: "My Attendance",
    "employee-info": "Employee Info",
    "employee-idcard": "Employee ID Card",
    "smart-search": "Smart Search",
};

/* ================================
   Load Reusable Components
================================ */

const sidebarPromise = fetch("/admin/components/sidebar.html")
    .then(response => response.text())
    .then(html => {
        document.getElementById("sidebar").innerHTML = html;
    });

const topbarPromise = fetch("/admin/components/topbar.html")
    .then(response => response.text())
    .then(html => {
        document.getElementById("topbar").innerHTML = html;
    });

Promise.all([sidebarPromise, topbarPromise]).then(() => {
    setupSidebarToggle();
    loadTopbarProfilePhoto();
});

/* ================================
   Load Profile Photo in Topbar
================================ */
function loadTopbarProfilePhoto() {
    const topbarImg = document.getElementById("topbarProfilePic");
    if (!topbarImg) return;

    let userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!userStr) return;

    try {
        const user = JSON.parse(userStr);
        const userId = user._id;
        if (!userId) return;

        fetch(`http://localhost:5000/api/auth/profile/${userId}`)
            .then(res => res.json())
            .then(data => {
                if (data.employee?.profilePhoto) {
                    topbarImg.src = data.employee.profilePhoto;
                    topbarImg.onerror = () => {
                        topbarImg.src = "../assets/images/admin.jpg";
                    };
                }
            })
            .catch(err => console.error("Error fetching profile photo:", err));
    } catch (err) {
        console.error("Error parsing user data:", err);
    }
}

/* ================================
   Page Navigation Function
================================ */

function navigate(pageName) {
    saveRecentlyUsed(pageName);

    fetch(`/admin/pages/${pageName}.html`)
        .then(response => response.text())
        .then(html => {
            document.getElementById("content").innerHTML = html;
            setActiveMenu(pageName);
            loadTopbarProfilePhoto();
            // ✅ DASHBOARD INIT (ADD THIS)
if (pageName === "dashboard") {
    setTimeout(() => {
        if (typeof initDashboard === "function") {
            initDashboard();
        }
    }, 100);
}

            if (pageName === "employee-info")   initEmployeeInfo();
            if (pageName === "smart-search")    initSmartSearch();
            if (pageName === "employee-idcard") initEmployeeIdCard();

            // ✅ Profile script
            if (pageName === "profile") {
                window._adminProfileLoaded = false;
                const oldScript = document.querySelector("script[data-profile]");
                if (oldScript) oldScript.remove();
                const script = document.createElement("script");
                script.src = "/admin/js/profile.js?t=" + Date.now();
                script.setAttribute("data-profile", "true");
                document.body.appendChild(script);
            }

            // ✅ Home — chatbot script load karo
            if (pageName === "home") {
                renderRecentlyUsed();
                const oldScript = document.querySelector("script[data-chatbot]");
                if (oldScript) oldScript.remove();
                const script = document.createElement("script");
                script.src = "/admin/js/chatbot.js?t=" + Date.now();
                script.setAttribute("data-chatbot", "true");
                document.body.appendChild(script);
            }
        })
        .catch(() => {
            document.getElementById("content").innerHTML =
                "<h2>Page Not Found</h2>";
        });
}

/* ================================
   Recently Used
================================ */

const MAX_RECENT = 6;

function saveRecentlyUsed(page) {
    if (page === "home") return;

    let recent = JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
    recent = recent.filter(p => p !== page);
    recent.unshift(page);
    if (recent.length > MAX_RECENT) recent.pop();
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
}

function renderRecentlyUsed() {
    const container = document.getElementById("recently-used-cards");
    if (!container) return;

    const recent = JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
    container.innerHTML = "";

    if (recent.length === 0) {
        container.innerHTML = `<p class="empty-text">No recently used tabs!</p>`;
        return;
    }

    recent.forEach(page => {
        const card = document.createElement("div");
        card.className = "home-card";
        card.textContent = ROUTES[page] || page;
        card.onclick = () => navigate(page);
        container.appendChild(card);
    });
}

/* ================================
   Active Menu
================================ */

function setActiveMenu(pageName) {
    const menuItems = document.querySelectorAll(".sidebar li");
    menuItems.forEach(item => {
        item.classList.remove("active");
        if (item.textContent.replace(" ", "").toLowerCase()
            .includes(pageName.replace("-", ""))) {
            item.classList.add("active");
        }
    });
}

/* ================================
   Default Page Load
================================ */

document.addEventListener("DOMContentLoaded", () => {
    navigate("home");
    
    // ✅ Chatbot script pehli baar bhi load karo
    setTimeout(() => {
        const oldScript = document.querySelector("script[data-chatbot]");
        if (oldScript) oldScript.remove();
        const script = document.createElement("script");
        script.src = "/admin/js/chatbot.js?t=" + Date.now();
        script.setAttribute("data-chatbot", "true");
        document.body.appendChild(script);
    }, 500);
});

/* ================================
   Sidebar Toggle
================================ */

function setupSidebarToggle() {
    const sidebar = document.getElementById("sidebar");
    const menuBtn = document.getElementById("menu-btn");

    menuBtn.addEventListener("mouseenter", () => {
        document.body.classList.add("sidebar-expanded");
    });

    sidebar.addEventListener("mouseleave", () => {
        setTimeout(() => {
            document.body.classList.remove("sidebar-expanded");
        }, 300);
    });
}

/* ================================
   Logout
================================ */

function handleLogout() {
    const existingOverlay = document.getElementById("logoutOverlay");
    if (!existingOverlay) {
        const overlay = document.createElement("div");
        overlay.id = "logoutOverlay";
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.backgroundColor = "rgba(0, 0, 0, 0.45)";
        overlay.style.zIndex = "9999";
        overlay.style.fontSize = "24px";
        overlay.style.fontWeight = "600";
        overlay.style.color = "#ffffff";
        overlay.style.letterSpacing = "0.5px";
        overlay.textContent = "Logging out...";
        document.body.appendChild(overlay);
    }

    localStorage.clear();
    sessionStorage.clear();

    setTimeout(() => {
        window.location.replace("/index.html");
    }, 1200);
}
// ✅ Auto call
initAdminProfile();