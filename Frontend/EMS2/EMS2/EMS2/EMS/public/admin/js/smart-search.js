// Global array to store employees fetched from backend
let employeesData = [];

// --- Generate department map dynamically from backend data ---
function getDeptMap() {
  const map = {};
  employeesData.forEach(emp => {
    const dept = emp.departmentInfo?.department;
    if (dept) {
      map[dept.toLowerCase()] = dept; // lowercase → standard name
    }
  });

  // Optional: add common short aliases manually
  if (map["computer science"]) map["cs"] = "Computer Science";
  if (map["information technology"]) map["it"] = "IT";
  if (map["human resources"]) map["hr"] = "Human Resources";

  return map;
}

// --- Initialize Smart Search ---
function initSmartSearch() {
  // Load data from backend
  reloadSmartSearch();

  

  // Expose reload function globally so employee-info.js can call it after CRUD
  window.smartSearchReload = reloadSmartSearch;
}

// --- Fetch employees from backend ---
async function reloadSmartSearch() {
  try {
    const res = await fetch("http://localhost:5000/api/employees?role=user");
    const data = await res.json();

    employeesData = data; // store globally for filtering
    runSearch();          // render table with current search/filter
  } catch (err) {
    console.error("Failed to load employees:", err);
  }
}

// --- Natural language detection patterns ---
const NL_PATTERNS = [/how many/i, /employees in/i, /show/i];

// --- Detect department dynamically ---
function detectDept(query) {
  const lower = query.toLowerCase();
  const deptMap = getDeptMap();
  const aliases = Object.keys(deptMap).sort((a, b) => b.length - a.length);

  for (const alias of aliases) {
    const regex = new RegExp("\\b" + alias + "\\b", "i");
    if (regex.test(lower)) return deptMap[alias];
  }

  return null; // if no department detected
}
function detectDesignation(query) {
  const lower = query.toLowerCase();

  for (let emp of employeesData) {
    const desig = emp.departmentInfo?.designation;
    if (desig && lower.includes(desig.toLowerCase())) {
      return desig;
    }
  }

  return null;
}

// --- Check if query is natural language ---
function isNLQuery(query) {
  return NL_PATTERNS.some(pattern => pattern.test(query));
}

// --- Main search/filter function ---
function runSearch() {
  const input = document.getElementById("searchInput");

  // 🔥 IMPORTANT FIX → prevents crash on dashboard
  if (!input) return;

  const raw = input.value.trim();
  const lower = raw.toLowerCase();

  const detectedDept = detectDept(raw);
  const detectedDesig = detectDesignation(raw); 
  const nlQuery = isNLQuery(raw);

  let filtered = [];

  if (!raw) {
    filtered = employeesData;
    hideAnswerBox();
  } else if (detectedDept) {
    filtered = employeesData.filter(emp => emp.departmentInfo?.department === detectedDept);

    if (nlQuery) {
      showAnswerBox(`There are ${filtered.length} employees in ${detectedDept}.`);
    } else {
      hideAnswerBox();
    }
  } 
  else if (detectedDesig) {
  filtered = employeesData.filter(emp =>
    emp.departmentInfo?.designation === detectedDesig
  );

  if (nlQuery) {
    showAnswerBox(`There are ${filtered.length} ${detectedDesig}(s).`);
  } else {
    hideAnswerBox();
  }

} 
  else {
    filtered = employeesData.filter(emp =>
      emp.empId.toLowerCase().includes(lower) ||
      ((emp.personalInfo?.firstName || "").toLowerCase().includes(lower)) ||
      ((emp.personalInfo?.lastName || "").toLowerCase().includes(lower))
    );
    hideAnswerBox();
  }

  renderTable(filtered);
  updateBanner(filtered.length, detectedDept || "Search Results");
  updateFooter(filtered.length);

  document.getElementById("noResults").style.display =
    filtered.length === 0 ? "block" : "none";
}

// --- Render table rows dynamically ---
function renderTable(data) {
  const tableBody = document.getElementById("empTable");
  tableBody.innerHTML = "";

  data.forEach(emp => {
    const first = emp.personalInfo?.firstName || emp.departmentInfo?.firstName || "";
    const last  = emp.personalInfo?.lastName  || emp.departmentInfo?.lastName  || "";
    const dept  = emp.departmentInfo?.department || "";
     const desig = emp.departmentInfo?.designation || ""; 
    tableBody.innerHTML += `
      <tr>
        <td>${emp.empId}</td>
        <td>${first} ${last}</td>
        <td>${dept}</td>
        <td>${desig}</td> 
      </tr>
    `;
  });
}


// --- Update department banner ---
function updateBanner(count, label) {
  document.getElementById("deptCount").textContent = count;
  document.getElementById("deptLabel").textContent = label;
}

// --- Update table footer ---
function updateFooter(count) {
  document.getElementById("footerCount").textContent =
    count === employeesData.length
      ? `Showing all ${employeesData.length} employees`
      : `Showing ${count} of ${employeesData.length} employees`;
}

// --- Show answer box for NL queries ---
function showAnswerBox(text) {
  document.getElementById("answerText").innerHTML = text;
  document.getElementById("answerBox").style.display = "block";
}

// --- Hide answer box ---
function hideAnswerBox() {
  document.getElementById("answerBox").style.display = "none";
}

// --- Initialize Smart Search on page load ---
window.addEventListener("DOMContentLoaded", initSmartSearch);