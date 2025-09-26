// js/layout.js
async function loadLayout(activePage) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  document.body.innerHTML = `
    <div class="app-container">
      <!-- Sidebar -->
      <aside class="sidebar">
        <h1>TaskFlow</h1>
        <nav id="sidebar-nav">
          <a href="home.html" class="${
            activePage === "home" ? "active" : ""
          }">🏠 Home</a>
          <a href="mywork.html" class="${
            activePage === "mywork" ? "active" : ""
          }">📝 My Work</a>

          <div class="section-title">Dashboard</div>
          <a href="kanban.html" class="${
            activePage === "kanban" ? "active" : ""
          }">📊 Board</a>
          <a href="calendar.html" class="${
            activePage === "calendar" ? "active" : ""
          }">📅 Calendar</a>
          <a href="list.html" class="${
            activePage === "list" ? "active" : ""
          }">📋 List</a>

          <div class="section-title">Spaces</div>
          <div id="spaces"></div>
          ${
            user.role === "admin"
              ? `<button class="create-btn" onclick="openCreateModal('workspace')">+ Create Workspace</button>`
              : ""
          }

          <div class="section-title">Projects</div>
          <div id="projects"></div>
          ${
            user.role === "admin"
              ? `<button class="create-btn" onclick="openCreateModal('project')">+ Create Project</button>`
              : ""
          }

          <a href="#">⚙ Settings</a>
        </nav>
      </aside>

      <!-- Navbar -->
      <header class="navbar">
        <div class="project-name">📁 Unknown Project</div>
        <div class="search-bar">
          <input type="text" placeholder="Search tasks, docs, people...">
        </div>
        <div class="right-actions">
          ${
            user.role === "admin"
              ? `<button class="new-btn" onclick="openCreateModal('task')">+ New</button>`
              : ""
          }
          <span>🔔</span>
          <span>${user.name ? user.name[0].toUpperCase() : "?"}</span>
          <button onclick="logout()">Logout</button>
        </div>
      </header>

      <!-- Main content -->
      <main class="content" id="content">
        <h2>${activePage.charAt(0).toUpperCase() + activePage.slice(1)}</h2>
        <div class="coming-soon">
          <h3>Coming Soon</h3>
          <p>This feature is under development</p>
        </div>
      </main>
    </div>

    <!-- Modal -->
    <div id="createModal" class="modal hidden">
      <div class="modal-content">
        <h3 id="modal-title">Create</h3>
        <input id="modal-input" type="text" placeholder="Enter name" />
        <select id="workspace-select" class="hidden"></select>
        <div class="modal-actions">
          <button onclick="closeModal()">Cancel</button>
          <button onclick="submitCreate()">Create</button>
        </div>
      </div>
    </div>
  `;

  await loadSidebarData();
}

// 🔹 Fetch and render sidebar items
async function loadSidebarData() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) {
      console.warn("No user logged in");
      return;
    }

    const allWorkspaces = await apiFetch("/workspaces");
    const allProjects = await apiFetch("/projects");

    // Workspaces where the user is a member
    const myWorkspaces = allWorkspaces.filter((ws) =>
      (ws.members || []).map(String).includes(String(user.id))
    );

    // Render workspaces
    document.getElementById("spaces").innerHTML = myWorkspaces
      .map((ws) => `<a href="#">🟦 ${ws.name}</a>`)
      .join("");

    // Projects only from user's workspaces
    const myProjects = allProjects.filter(
      (p) =>
        p.workspaceId &&
        myWorkspaces.some((ws) => String(ws.id) === String(p.workspaceId))
    );

    document.getElementById("projects").innerHTML = myProjects
      .map((p) => `<a href="#">🔵 ${p.name}</a>`)
      .join("");

    // Populate workspace dropdown in modal (for creating projects)
    const workspaceSelect = document.getElementById("workspace-select");
    if (workspaceSelect) {
      workspaceSelect.innerHTML = myWorkspaces
        .map((ws) => `<option value="${ws.id}">${ws.name}</option>`)
        .join("");
    }

    // Debug logs
    console.log("User:", user.id, "Role:", user.role);
    console.log("My Workspaces:", myWorkspaces);
    console.log("All Projects:", allProjects);
    console.log("Filtered Projects:", myProjects);
  } catch (err) {
    console.error("Could not load spaces/projects", err);
  }
}

// 🔹 Modal handling
let currentType = null;
function openCreateModal(type) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (user.role !== "admin") {
    return alert("Only admins can create " + type);
  }

  currentType = type;
  document.getElementById("modal-title").innerText = `Create ${type}`;
  document.getElementById("modal-input").value = "";

  // Show workspace select only when creating a project
  const wsSelect = document.getElementById("workspace-select");
  wsSelect.classList.toggle("hidden", type !== "project");

  document.getElementById("createModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("createModal").classList.add("hidden");
}

async function submitCreate() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (user.role !== "admin") {
    return alert("Only admins can create workspaces or projects");
  }

  const name = document.getElementById("modal-input").value.trim();
  if (!name) return alert("Name is required");

  try {
    if (currentType === "workspace") {
      await apiFetch("/workspaces", {
        method: "POST",
        body: JSON.stringify({ name, members: [user.id] }),
      });
    } else if (currentType === "project") {
      const workspaceId = parseInt(
        document.getElementById("workspace-select").value
      );
      if (!workspaceId) {
        return alert("Please select a workspace for this project");
      }
      await apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify({ name, workspaceId }),
      });
    } else {
      alert("Unsupported type: " + currentType);
    }

    closeModal();
    await loadSidebarData();
  } catch (err) {
    console.error("Failed to create", err);
    alert("Error creating " + currentType);
  }
}
