document.addEventListener("DOMContentLoaded", () => {
    const reportForm = document.getElementById("reportForm");
    const confirmationMessage = document.getElementById("confirmationMessage");

    // -------------------------------
    // User Submission Logic
    // -------------------------------
    if (reportForm) {
        reportForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const name = document.getElementById("name").value || "Anonymous";
            const department = document.getElementById("department").value;
            const description = document.getElementById("description").value;

            const report = {
                id: Date.now(), // Unique ID
                name,
                department,
                description,
                date_reported: new Date().toLocaleDateString(),
                status: "Pending"
            };

            const reports = JSON.parse(localStorage.getItem("reports")) || [];
            reports.push(report);
            localStorage.setItem("reports", JSON.stringify(reports));

            reportForm.reset();
            confirmationMessage.classList.remove("hidden");

            setTimeout(() => confirmationMessage.classList.add("hidden"), 2500);
        });
    }

    // -------------------------------
    // Admin Dashboard Logic
    // -------------------------------
    const tableBody = document.querySelector("#reportsTable tbody");
    if (tableBody) {
        function renderReports() {
            const reports = JSON.parse(localStorage.getItem("reports")) || [];
            tableBody.innerHTML = ""; // Clear previous rows

            if (reports.length === 0) {
                tableBody.innerHTML = "<tr><td colspan='6'>No reports found.</td></tr>";
            } else {
                reports.forEach((r, index) => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${r.name}</td>
                        <td>${r.department}</td>
                        <td>${r.description}</td>
                        <td>${r.date_reported}</td>
                        <td>
                            <select data-id="${r.id}" class="status-select">
                                <option value="Pending" ${r.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                <option value="Under Review" ${r.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
                                <option value="Reviewed" ${r.status === 'Reviewed' ? 'selected' : ''}>Reviewed</option>
                            </select>
                            <button data-id="${r.id}" class="delete-btn">Delete</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });

                // Attach event listeners for status change
                document.querySelectorAll(".status-select").forEach(select => {
                    select.addEventListener("change", (e) => {
                        const id = parseInt(e.target.getAttribute("data-id"));
                        const reports = JSON.parse(localStorage.getItem("reports")) || [];
                        const report = reports.find(r => r.id === id);
                        if (report) {
                            report.status = e.target.value;
                            localStorage.setItem("reports", JSON.stringify(reports));
                        }
                    });
                });

                // Attach event listeners for delete buttons
                document.querySelectorAll(".delete-btn").forEach(btn => {
                    btn.addEventListener("click", (e) => {
                        const id = parseInt(e.target.getAttribute("data-id"));
                        let reports = JSON.parse(localStorage.getItem("reports")) || [];
                        reports = reports.filter(r => r.id !== id);
                        localStorage.setItem("reports", JSON.stringify(reports));
                        renderReports(); // Refresh table
                    });
                });
            }
        }

        renderReports();
    }
});
