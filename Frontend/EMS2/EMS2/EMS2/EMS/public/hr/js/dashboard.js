console.log("HR Dashboard JS Loaded");

let chartInstance = null;

async function loadDashboard() {
  try {
    const res = await fetch("http://localhost:5000/api/dashboard/stats");
    const data = await res.json();

    document.getElementById("total-employees").innerText = data.totalEmployees;
    document.getElementById("active-employees").innerText = data.activeEmployees;
    document.getElementById("new-hires").innerText = data.newHires;
    document.getElementById("departments-count").innerText = data.departments;

  } catch (err) {
    console.error(err);
  }
}

async function loadChart() {
  try {
    const res = await fetch("http://localhost:5000/api/dashboard/distribution");
    const data = await res.json();

    const labels = Object.keys(data);
    const values = Object.values(data);

    const ctx = document.getElementById("deptChart");
    if (!ctx) return;

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: "#3e8e92"
        }]
      },
      options: {
  responsive: true,
  maintainAspectRatio: false, // ✅ FIX GRAPH STRETCH
  plugins: {
    legend: { display: false }
  }
}
    });

  } catch (err) {
    console.error(err);
  }
}

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = { year:31536000, month:2592000, day:86400, hour:3600, minute:60 };

  for (let key in intervals) {
    const value = Math.floor(seconds / intervals[key]);
    if (value >= 1) return `${value} ${key}${value > 1 ? "s" : ""} ago`;
  }

  return "just now";
}

async function loadHRActivity() {
  try {
   const res = await fetch("http://localhost:5000/api/dashboard/activity?role=hr");
    const data = await res.json();

    const container = document.getElementById("recent-activity-container");
    container.innerHTML = "";

    if (!data.length) {
      container.innerHTML = "<p>No recent activity</p>";
      return;
    }

    data.forEach(a => {
      const div = document.createElement("div");
      div.className = "activity-item";

      let icon = "📄";
      if (a.text.includes("Total")) icon = "📊";
      if (a.text.includes("profile")) icon = "👤";

      div.innerHTML = `
        <span class="activity-text">${icon} ${a.text}</span>
        <span class="activity-time">${timeAgo(a.time)}</span>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  loadChart();
  loadHRActivity();

  setInterval(() => {
    loadDashboard();
    loadChart();
    loadHRActivity();
  }, 10000);
});