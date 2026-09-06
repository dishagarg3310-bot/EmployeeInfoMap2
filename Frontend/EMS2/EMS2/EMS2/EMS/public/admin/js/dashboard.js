console.log("Dashboard JS Loaded");

let chartInstance = null;

/* ======================
   LOAD DASHBOARD
====================== */
async function loadDashboard() {
  try {
    console.log("Calling stats API...");

    const res = await fetch("http://localhost:5000/api/dashboard/stats");
    const data = await res.json();

    console.log("Stats Data:", data);

    document.getElementById("total-employees").innerText = data.totalEmployees;
    document.getElementById("active-employees").innerText = data.activeEmployees;
    document.getElementById("new-hires").innerText = data.newHires;
    document.getElementById("departments-count").innerText = 10;

  } catch (err) {
    console.error("Dashboard error:", err);
  }
}

/* ======================
   LOAD GRAPH
====================== */
async function loadChart() {
  try {
    console.log("Calling distribution API...");

    const res = await fetch("http://localhost:5000/api/dashboard/distribution");
    const data = await res.json();

    console.log("Chart Data:", data);

    const labels = Object.keys(data);
    const values = Object.values(data);

    if (chartInstance) {
      chartInstance.destroy();
    }
const canvas = document.getElementById("deptChart");
if (!canvas) return;

chartInstance = new Chart(canvas, {
  type: "bar",
  data: {
    labels,
    datasets: [{
      label: "Employees",
      data: values,
      backgroundColor: "#3e8e92"
    }]
  },
      options: {
  responsive: true,
  maintainAspectRatio: false, // 🔥 IMPORTANT
  plugins: {
    legend: { display: false }
  }
}
    });

  } catch (err) {
    console.error("Chart error:", err);
  }
}

/* ======================
   TIME AGO
====================== */
function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (let key in intervals) {
    const value = Math.floor(seconds / intervals[key]);
    if (value >= 1) {
      return `${value} ${key}${value > 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}

/* ======================
   LOAD ACTIVITY
====================== */
async function loadActivity() {
  try {
    console.log("Calling activity API...");

    const res = await fetch("http://localhost:5000/api/dashboard/activity?role=admin")
    const data = await res.json();

    console.log("Activity Data:", data);

    const container = document.getElementById("recent-activity-container");
    container.innerHTML = "";

    if (data.length === 0) {
      container.innerHTML = "<p>No recent activity</p>";
      return;
    }

    data.forEach(a => {
      const div = document.createElement("div");
      div.className = "activity-item";

      let icon = "📌";
      if (a.text.includes("ID Card")) icon = "🆔";
      else if (a.text.includes("New hire")) icon = "🆕";
      else if (a.text.includes("Converted")) icon = "🔄";

      div.innerHTML = `
        <span class="activity-text">${icon} ${a.text}</span>
        <span class="activity-time">${timeAgo(a.time)}</span>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    console.error("Activity error:", err);
  }
}

/* ======================
   INIT
====================== */
function initDashboard() {
  console.log("Dashboard INIT called ✅");

  loadDashboard();
  loadChart();
  loadActivity();

  setInterval(() => {
    loadDashboard();
    loadChart();
    loadActivity();
  }, 10000);
}