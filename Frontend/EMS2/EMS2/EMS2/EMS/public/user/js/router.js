/* ========================================
   Routes
======================================== */
const ROLE = "user";
const RECENT_KEY = `${ROLE}_recentPages`;

const ROUTES = {
    home: "Home",
    dashboard: "My Dashboard",
    profile: "My Profile",
    attendance: "My Attendance",
    "employee-id": "Employee ID Card",
    settings: "Settings"
};

/* ========================================
   Load Sidebar
======================================== */
const sidebarPromise = fetch("/user/components/sidebar.html")
    .then(res => res.text())
    .then(html => {
        document.getElementById("sidebar").innerHTML = html;

        document.querySelectorAll("#sidebar li").forEach(item => {
            item.addEventListener("click", () => {
                const text = item.textContent.trim().toLowerCase();

                if (text.includes("home"))            navigate("home");
                else if (text.includes("dashboard"))  navigate("dashboard");
                else if (text.includes("profile"))    navigate("profile");
                else if (text.includes("attendance")) navigate("attendance");
                else if (text.includes("employee"))   navigate("employee-id");
                else if (text.includes("settings"))   navigate("settings");
                else if (text.includes("logout"))     handleLogout();
            });
        });
    });

/* ========================================
   Load Topbar
======================================== */
const topbarPromise = fetch("/user/components/topbar.html")
    .then(res => res.text())
    .then(html => {
        document.getElementById("topbar").innerHTML = html;
        loadProfilePhoto();
    });

Promise.all([sidebarPromise, topbarPromise]).then(() => {
    setupSidebarToggle();
});

/* ========================================
   Page Navigation
======================================== */
function navigate(pageName) {
    saveRecentlyUsed(pageName);

    fetch(`/user/pages/${pageName}.html`)
        .then(res => {
            if (!res.ok) throw new Error("404");
            return res.text();
        })
        .then(html => {
            document.getElementById("content").innerHTML = html;
            setActiveMenu(pageName);
            loadProfilePhoto();

            // ✅ Profile script
            if (pageName === "profile") {
                window._profileLoaded = false;
                const oldScript = document.querySelector("script[data-profile]");
                if (oldScript) oldScript.remove();
                const script = document.createElement("script");
                script.src = "/user/js/profile.js?t=" + Date.now();
                script.setAttribute("data-profile", "true");
                document.body.appendChild(script);
            }

            // ✅ Employee ID script
            if (pageName === "employee-id") {
                const oldScript = document.querySelector("script[data-employeeid]");
                if (oldScript) oldScript.remove();
                const script = document.createElement("script");
                script.src = "/user/js/employee-id.js?t=" + Date.now();
                script.setAttribute("data-employeeid", "true");
                document.body.appendChild(script);
            }

            // ✅ Home — chatbot script load karo
            if (pageName === "home") {
                renderRecentlyUsed();
                const oldScript = document.querySelector("script[data-chatbot]");
                if (oldScript) oldScript.remove();
                const script = document.createElement("script");
                script.src = "/user/js/chatbot.js?t=" + Date.now();
                script.setAttribute("data-chatbot", "true");
                document.body.appendChild(script);
            }
        })
        .catch(() => {
            document.getElementById("content").innerHTML =
                "<h2>Page Not Found</h2>";
        });
}

/* ========================================
   Recently Used Pages
======================================== */
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
        container.innerHTML = "<p>No recently used tabs!</p>";
        return;
    }

    recent.forEach(page => {
        if (!ROUTES[page]) return;

        const card = document.createElement("div");
        card.className = "home-card";
        card.textContent = ROUTES[page];
        card.onclick = () => navigate(page);
        container.appendChild(card);
    });
}

/* ========================================
   Highlight Active Menu
======================================== */
function setActiveMenu(pageName) {
    document.querySelectorAll(".sidebar li").forEach(item => {
        item.classList.remove("active");
        const text = item.textContent.replace(/\s+/g, "").toLowerCase();
        if (text.includes(pageName.replace("-", ""))) {
            item.classList.add("active");
        }
    });
}

/* ========================================
   Sidebar Toggle
======================================== */
function setupSidebarToggle() {
    const sidebar = document.getElementById("sidebar");
    const menuBtn = document.getElementById("menu-btn");

    if (!sidebar || !menuBtn) return;

    menuBtn.addEventListener("mouseenter", () => {
        document.body.classList.add("sidebar-expanded");
    });

    sidebar.addEventListener("mouseleave", () => {
        setTimeout(() => {
            document.body.classList.remove("sidebar-expanded");
        }, 300);
    });
}

/* ========================================
   Auth Guard
======================================== */
(function authGuard() {
    const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

    if (!token) {
        window.location.replace("/index.html");
    }
})();

/* ========================================
   Logout
======================================== */
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

/* ========================================
   Load Profile Photo in Topbar
======================================== */
function loadProfilePhoto() {
    const user = JSON.parse(localStorage.getItem("user")) || JSON.parse(sessionStorage.getItem("user"));
    if (!user || !user._id) return;

    const cachedPhoto = localStorage.getItem("profilePhoto");
    if (cachedPhoto) {
        const topbarImg = document.getElementById("topbarProfilePic");
        if (topbarImg) topbarImg.src = cachedPhoto;
        return;
    }

    fetch(`http://localhost:5000/api/employees/me/${user._id}`)
        .then(res => res.json())
        .then(emp => {
            if (emp.profilePhoto) {
                const topbarImg = document.getElementById("topbarProfilePic");
                if (topbarImg) {
                    topbarImg.src = emp.profilePhoto;
                    localStorage.setItem("profilePhoto", emp.profilePhoto);
                }
            }
        })
        .catch(err => console.error("Error loading profile pic:", err));
}

/* ========================================
   Default Page Load
======================================== */
document.addEventListener("DOMContentLoaded", () => {
    navigate("home");
    
    // ✅ Chatbot script pehli baar bhi load karo
    setTimeout(() => {
        const oldScript = document.querySelector("script[data-chatbot]");
        if (oldScript) oldScript.remove();
        const script = document.createElement("script");
        script.src = "/user/js/chatbot.js?t=" + Date.now();
        script.setAttribute("data-chatbot", "true");
        document.body.appendChild(script);
    }, 500);
});