const ROLE = "hr";
const RECENT_KEY = `${ROLE}_recentPages`;

const ROUTES = {
    home: "Home",
    dashboard: "My Dashboard",
    profile: "My Profile",
    attendance: "My Attendance",
    "smart-search": "Smart Search",
    "resume-parsing": "Resume Parsing"
};

/* ================================
   Load Reusable Components
================================ */

const sidebarPromise = fetch("/hr/components/sidebar.html")
    .then(response => response.text())
    .then(html => {
        document.getElementById("sidebar").innerHTML = html;
    });

const topbarPromise = fetch("/hr/components/topbar.html")
    .then(response => response.text())
    .then(html => {
        document.getElementById("topbar").innerHTML = html;
        loadTopbarProfilePhoto();
    });

Promise.all([sidebarPromise, topbarPromise]).then(() => {
    setupSidebarToggle();
});

/* ================================
   Page Navigation Function
================================ */

function navigate(pageName) {
    saveRecentlyUsed(pageName);

    fetch(`/hr/pages/${pageName}.html`)
        .then(response => {
            if (!response.ok) throw new Error("Page not found");
            return response.text();
        })
        .then(html => {
            document.getElementById("content").innerHTML = html;
            setActiveMenu(pageName);
            loadTopbarProfilePhoto();
// ✅ HR DASHBOARD INIT (ADD THIS)
if (pageName === "dashboard") {
    setTimeout(() => {
        if (typeof initDashboard === "function") {
            initDashboard();
        }
    }, 100);
}
            // ✅ Home — chatbot script load karo
            if (pageName === "home") {
                renderRecentlyUsed();
                const oldScript = document.querySelector("script[data-chatbot]");
                if (oldScript) oldScript.remove();
                const script = document.createElement("script");
                script.src = "/hr/js/chatbot.js?t=" + Date.now();
                script.setAttribute("data-chatbot", "true");
                document.body.appendChild(script);
            }

            // ✅ Profile script
            if (pageName === "profile") {
                window._profileLoaded = false;
                const oldScript = document.querySelector("script[data-profile]");
                if (oldScript) oldScript.remove();
                const script = document.createElement("script");
                script.src = "/hr/js/profile.js?t=" + Date.now();
                script.setAttribute("data-profile", "true");
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
   Highlight Active Menu
================================ */

function setActiveMenu(pageName) {
    const menuItems = document.querySelectorAll(".sidebar li");
    menuItems.forEach(item => {
        item.classList.remove("active");
        if (item.textContent.replace(/\s/g, "").toLowerCase()
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
        script.src = "/hr/js/chatbot.js?t=" + Date.now();
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

/* ================================
   Load Profile Photo in Topbar
================================ */
function loadTopbarProfilePhoto() {
    const user = JSON.parse(localStorage.getItem("user")) || JSON.parse(sessionStorage.getItem("user"));
    if (!user || !user._id) return;

    const cachedPhoto = localStorage.getItem("profilePhoto") || sessionStorage.getItem("profilePhoto");
    if (cachedPhoto) {
        const topbarImg = document.getElementById("topbarProfilePic");
        if (topbarImg) topbarImg.src = cachedPhoto;
        return Promise.resolve(cachedPhoto);
    }

    return fetch(`http://localhost:5000/api/auth/profile/${user._id}`)
        .then(res => res.json())
        .then(data => {
            const emp = data.employee || {};
            if (emp.profilePhoto) {
                const topbarImg = document.getElementById("topbarProfilePic");
                if (topbarImg) {
                    topbarImg.src = emp.profilePhoto;
                }
                localStorage.setItem("profilePhoto", emp.profilePhoto);
                sessionStorage.setItem("profilePhoto", emp.profilePhoto);
                return emp.profilePhoto;
            }
            return null;
        })
        .catch(err => console.error("Error loading profile pic:", err));
}