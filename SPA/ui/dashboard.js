import { badge, emptyRow } from "./common.js";

export async function renderDashboard() {
    const projects = await FB.getAll("projects", "createdAt");
    const columns = ["Lead", "In Progress", "Review", "Done"];
    const byStatus = {};
    columns.forEach(c => byStatus[c] = []);
    projects.forEach(p => {
        if (byStatus[p.status] !== undefined) byStatus[p.status].push(p);
        else byStatus["Lead"].push(p);
    });

    let html = `<div class="kanban-board">`;
    for (const col of columns) {
        const cards = byStatus[col];
        const colorMap = { "Lead": "#6b7585", "In Progress": "#5b9cf6", "Review": "#f0c040", "Done": "#3ddc84" };
        html += `
            <div class="kanban-col">
                <div class="kanban-col-header">
                    <span style="color:${colorMap[col]}">${col}</span>
                    <span class="col-count">${cards.length}</span>
                </div>
                <div class="kanban-cards" data-status="${col}"> 
                ${cards.map(p => `
                <div class="kanban-card" data-project-id="${p.id}" data-current-status="${p.status}" onclick="APP.openProjectPane('${p.id}')">
                  <div class="card-title">${p.title || "Untitled"}</div>
                  <div class="card-client">${p.clientName || "No client"}</div>
                  <div class="card-meta">
                    ${badge(p.type || "Other")}
                    <span class="card-deadline">${p.deadline ? p.deadline : ""}</span>
                  </div>
                </div>
              `).join("")}
            </div>
            <button class="add-card-btn" onclick="APP.showAddProject('${col}')">+ Add project</button>
          </div>`;
    }
    html += `</div>`;
    return html;
}
