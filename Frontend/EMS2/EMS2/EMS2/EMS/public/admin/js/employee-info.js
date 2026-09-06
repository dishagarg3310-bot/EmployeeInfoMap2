function initEmployeeInfo() {

  const employeeType = document.getElementById("employeeType");
  const employeeList = document.getElementById("employeeList");
  const actionButtons = document.getElementById("actionButtons");
  const modal = document.getElementById("employeeModal");
  const form = document.getElementById("employeeForm");

  let selectedEmployee = null;
  let modalMode = null;
  let allEmployees = [];

  const deptFields = ["empDept", "empDesignation", "empJoinDate", "empPresentAppDate", "empPayScale"];
  const personalFields = [
    "empFatherName","empMotherName","empGender","empEmail","empPhone",
    "empMaritalStatus","empSpouseName","empAddress1","empAddress2",
    "empMotherTongue","empCategory","empCity","empState","empPincode"
  ];

  function disableAll() {
    document.querySelectorAll("#employeeForm input, #employeeForm select").forEach(e => e.disabled = true);
  }

  function enableDepartment() {
    deptFields.forEach(id => document.getElementById(id).disabled = false);
  }

  function disablePersonal() {
    personalFields.forEach(id => document.getElementById(id).disabled = true);
  }

  function renderEmployeeRows(employees) {
    employeeList.innerHTML = "";
    actionButtons.innerHTML = "";
    selectedEmployee = null;

    employees.forEach(emp => {
      const row = document.createElement("div");
      row.className = "employee-row";

      let first = emp.personalInfo?.firstName || emp.departmentInfo?.firstName || "";
      let last  = emp.personalInfo?.lastName  || emp.departmentInfo?.lastName  || "";
      
      // Fallback: if both are empty, try the name property
      if (!first && !last && emp.name) {
        const parts = emp.name.trim().split(" ");
        first = parts[0] || "";
        last = parts.slice(1).join(" ") || "";
      }
      
      const fullName = (first + " " + last).trim() || "No Name";

      row.innerHTML = `<span>${emp.empId}</span><span>${fullName}</span>`;
      row.onclick = () => selectEmployee(emp, row);
      employeeList.appendChild(row);
    });
  }

  async function loadEmployees() {
    // Fetch employees
    const empRes = await fetch("http://localhost:5000/api/employees");
    let employees = await empRes.json();

    // 🔥 FILTER OUT ADMIN/HR STAFF - Only show actual employees (EMP001, EMP002, etc.)
    // Exclude ADM (Admin) and HR (Human Resources) staff
    employees = employees.filter(emp => {
      const empId = emp.empId || "";
      const isActualEmployee = empId.match(/^EMP\d+/); // Only EMP001, EMP002, etc.
      return isActualEmployee;
    });

    console.log("✅ Filtered employees (excluding admin/hr):", employees.length);

    // Find max EMP number from existing employees
    let maxEmpNum = 0;
    employees.forEach(emp => {
      const match = emp.empId?.match(/EMP(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxEmpNum) {
          maxEmpNum = num;
        }
      }
    });

    // Fetch candidates and convert them to employee format
    const candRes = await fetch("http://localhost:5000/api/candidates");
    const candidates = await candRes.json();

    // Convert candidates to employee-like objects with isCandidate flag
    let candidateCounter = maxEmpNum + 1;
    const candidateEmployees = candidates
      .filter(c => c.status !== "CONVERTED") // Don't show already converted candidates
      .map(c => {
        const empId = `EMP${String(candidateCounter).padStart(3, '0')}`;
        candidateCounter++;
        return {
          _id: c._id,
          candidateId: c._id,
          empId: empId,
          isCandidate: true,
          name: c.name,
          email: c.email,
          phone: c.phone,
          skills: c.skills,
          status: "new",
          departmentInfo: {
            firstName: (c.name || "").split(" ")[0] || "",
            lastName: (c.name || "").split(" ").slice(1).join(" ") || ""
          },
          personalInfo: {
            email: c.email,
            phone: c.phone
          }
        };
      });

    // Merge employees and candidates
    allEmployees = [...employees, ...candidateEmployees];

    applyFilters();
  }

  function applyFilters() {
    const statusFiltered =
      employeeType.value === "active"
        ? allEmployees.filter(e => e.status === "active")
        : allEmployees.filter(e => e.status === "new");

    const query = (document.getElementById("searchInput").value || "").trim().toLowerCase();

    const finalFiltered = query
      ? statusFiltered.filter(emp => {
          let first = emp.personalInfo?.firstName || emp.departmentInfo?.firstName || "";
          let last = emp.personalInfo?.lastName || emp.departmentInfo?.lastName || "";
          
          // Fallback: if both are empty, try the name property
          if (!first && !last && emp.name) {
            const parts = emp.name.trim().split(" ");
            first = parts[0] || "";
            last = parts.slice(1).join(" ") || "";
          }
          
          const fullName = (first + " " + last).trim().toLowerCase();
          return emp.empId.toLowerCase().includes(query) || fullName.includes(query);
        })
      : statusFiltered;

    renderEmployeeRows(finalFiltered);
  }

  function selectEmployee(emp, row) {
    document.querySelectorAll(".employee-row").forEach(r => r.classList.remove("selected"));
    row.classList.add("selected");
    selectedEmployee = emp;
    renderButtons();
  }

  function renderButtons() {
    actionButtons.innerHTML = "";
    if (!selectedEmployee) return;

    if (selectedEmployee.status === "new") {
      const add = document.createElement("button");
      add.textContent = "Add";
      add.className = "btn-add";
      add.onclick = () => openAdd(selectedEmployee);
      actionButtons.appendChild(add);
    } else {
      const view = document.createElement("button");
      view.textContent = "View";
      view.className = "btn-view";
      view.onclick = () => openView(selectedEmployee);

      const update = document.createElement("button");
      update.textContent = "Update";
      update.className = "btn-update";
      update.onclick = () => openUpdate(selectedEmployee);

      const del = document.createElement("button");
      del.textContent = "Delete";
      del.className = "btn-delete";
      del.onclick = () => deleteEmployee(selectedEmployee);

      actionButtons.append(view, update, del);
    }
  }

  function fill(emp) {
    const first = emp.personalInfo?.firstName || emp.departmentInfo?.firstName || (emp.name ? emp.name.split(" ")[0] : "");
    const last = emp.personalInfo?.lastName || emp.departmentInfo?.lastName || (emp.name ? emp.name.split(" ").slice(1).join(" ") : "");
    
    empID.value = emp.empId || emp._id.toString();
    empFName.value = first;
    empMName.value = emp.personalInfo?.middleName || emp.departmentInfo?.middleName || "";
    empLName.value = last;

    empDept.value = emp.departmentInfo?.department || "";
    empDesignation.value = emp.departmentInfo?.designation || "";
    empJoinDate.value = emp.departmentInfo?.joiningDate || "";
    empPresentAppDate.value = emp.departmentInfo?.presentAppDate || "";
    empPayScale.value = emp.departmentInfo?.payScale || "";
  }
  function fillPersonal(emp) {
  const p = emp.personalInfo || {};

  empFatherName.value     = p.fatherName || "";
  empMotherName.value     = p.motherName || "";
  empGender.value         = p.gender || "";
  empEmail.value          = p.email || "";
  empPhone.value          = p.phone || "";
  empMaritalStatus.value  = p.maritalStatus || "";
  empSpouseName.value     = p.spouseName || "";
  empAddress1.value       = p.address1 || "";
  empAddress2.value       = p.address2 || "";
  empMotherTongue.value   = p.motherTongue || "";
  empCategory.value       = p.category || "";
  empCity.value           = p.city || "";
  empState.value          = p.state || "";
  empPincode.value        = p.pincode || "";
}


  function openAdd(emp) {
    modalMode = "add";
    fill(emp);
    fillPersonal(emp);
    disableAll();
    enableDepartment();
    disablePersonal();
    modal.style.display = "flex";
  }

  function openView(emp) {
    modalMode = "view";
    fill(emp);
    fillPersonal(emp); 
    disableAll();
    modal.style.display = "flex";
  }

  function openUpdate(emp) {
    modalMode = "update";
    fill(emp);
    fillPersonal(emp); 
    disableAll();
    enableDepartment();
    disablePersonal();
    modal.style.display = "flex";
  }

  form.onsubmit = async e => {
    e.preventDefault();

    try {
      if (modalMode === "add") {
        // Handle candidate conversion
        if (selectedEmployee.isCandidate) {
          const response = await fetch(`http://localhost:5000/api/candidates/${selectedEmployee.candidateId}/to-employee`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              empId: empID.value,
              departmentInfo: {
                department: empDept.value,
                designation: empDesignation.value,
                joiningDate: empJoinDate.value,
                presentAppDate: empPresentAppDate.value,
                payScale: empPayScale.value
              }
            })
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to convert candidate to employee");
          }
          
          const result = await response.json();
          alert(`✓ Candidate converted successfully!\nEmployee ID: ${result.employee.empId}\nUsername: ${result.login.username}\nPassword: ${result.login.password}`);
        } else {
          // Handle regular employee creation
          const response = await fetch("http://localhost:5000/api/employees/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              empId: empID.value,
              firstName: empFName.value,
              middleName: empMName.value,
              lastName: empLName.value,
              departmentInfo: {
                department: empDept.value,
                designation: empDesignation.value,
                joiningDate: empJoinDate.value,
                presentAppDate: empPresentAppDate.value,
                payScale: empPayScale.value
              }
            })
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to create employee");
          }
          
          alert("✓ Employee added successfully!");
        }
      }

      if (modalMode === "update") {
        const response = await fetch(`http://localhost:5000/api/employees/${selectedEmployee.empId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            department: empDept.value,
            designation: empDesignation.value,
            joiningDate: empJoinDate.value,
            presentAppDate: empPresentAppDate.value,
            payScale: empPayScale.value
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to update employee");
        }
        
        alert("✓ Employee updated successfully!");
      }

      modal.style.display = "none";
      loadEmployees();
    } catch (error) {
      alert(`✗ Error: ${error.message}`);
      console.error("Form submission error:", error);
    }
  };

  async function deleteEmployee(emp) {
    await fetch(`http://localhost:5000/api/employees/${emp.empId}`, { method: "DELETE" });
    loadEmployees();
  }

  employeeType.onchange = applyFilters;
  document.getElementById("searchInput").oninput = applyFilters;
  document.querySelector(".btn-cancel").onclick = () => modal.style.display = "none";

  loadEmployees();
}
