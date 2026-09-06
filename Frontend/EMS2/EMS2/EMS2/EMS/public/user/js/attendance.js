const data = {
    summary: { present: 22, absent: 1, leave: 2, working: 25 },
    records: [
        {
            date: "01 Jan 2026",
            day: "Thursday",
            status: "Present",
            in: "09:05 AM",
            out: "06:02 PM"
        },
        {
            date: "03 Jan 2026",
            day: "Saturday",
            status: "Absent",
            in: "-",
            out: "-"
        }
    ]
};

document.getElementById("presentCount").innerText = data.summary.present;
document.getElementById("absentCount").innerText = data.summary.absent;
document.getElementById("leaveCount").innerText = data.summary.leave;
document.getElementById("workingDays").innerText = data.summary.working;

const tbody = document.getElementById("attendanceBody");

data.records.forEach(r => {
    const tr = document.createElement("tr");
    let cls =
        r.status === "Present" ? "status-present" :
        r.status === "Absent" ? "status-absent" :
        "status-leave";

    tr.innerHTML = `
        <td>${r.date}</td>
        <td>${r.day}</td>
        <td class="${cls}">${r.status}</td>
        <td>${r.in}</td>
        <td>${r.out}</td>
    `;
    tbody.appendChild(tr);
});