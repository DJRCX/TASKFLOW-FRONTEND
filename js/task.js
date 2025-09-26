async function loadProjectTasks(projectId) {
  const tasks = await apiFetch(`/tasks?projectId=${projectId}`);
  renderKanban(tasks);
}

function renderKanban(tasks) {
  const map = { "To Do": "todo", "In Progress": "inprogress", Done: "done" };
  // clear cols
  Object.values(map).forEach(
    (id) => (document.getElementById(id).innerHTML = "")
  );
  tasks.forEach((task) => {
    const colId = map[task.status] || "todo";
    const card = document.createElement("div");
    card.className = "task-card";
    card.draggable = true;
    card.dataset.taskId = task.id;
    card.innerHTML = `<strong>${task.name}</strong><div>${task.priority}</div>`;
    attachDragHandlers(card);
    document.getElementById(colId).appendChild(card);
  });
}

function attachDragHandlers(card) {
  card.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", card.dataset.taskId);
    card.classList.add("dragging");
  });
  card.addEventListener("dragend", (e) => card.classList.remove("dragging"));
}

["todo", "inprogress", "done"].forEach((id) => {
  const col = document.getElementById(id);
  col.addEventListener("dragover", (e) => e.preventDefault());
  col.addEventListener("drop", async (e) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    const newStatus = col.dataset.status;
    const card = document.querySelector(`[data-task-id="${taskId}"]`);
    if (card) col.appendChild(card);
    try {
      await apiFetch(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("save failed", err);
      alert("Could not save status");
    }
  });
});
