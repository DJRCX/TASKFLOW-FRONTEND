// Mock login: find user in db.json
async function login(email, password) {
  const users = await apiFetch(
    `/users?email=${encodeURIComponent(email)}&password=${encodeURIComponent(
      password
    )}`
  );
  if (users.length > 0) {
    const user = users[0];
    // Save fake token & user info
    localStorage.setItem("token", "mock-token-" + user.id);
    localStorage.setItem("user", JSON.stringify(user));
    window.location.href = "pages/home.html";
  } else {
    alert("Invalid email or password");
  }
}

// Mock signup: add user to db.json
async function signup(name, email, password) {
  const existing = await apiFetch(`/users?email=${encodeURIComponent(email)}`);
  if (existing.length > 0) {
    alert("User already exists!");
    return;
  }

  const newUser = await apiFetch(`/users`, {
    method: "POST",
    body: JSON.stringify({ name, email, password, role: "member" }),
  });

  // Auto-login after signup
  localStorage.setItem("token", "mock-token-" + newUser.id);
  localStorage.setItem("user", JSON.stringify(newUser));
  window.location.href = "home.html";
}

// Logout
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "../login.html";
}

// Helper to get current user
function getCurrentUser() {
  return JSON.parse(localStorage.getItem("user") || "null");
}
