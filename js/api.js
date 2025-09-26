async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = options.headers || {};
  headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {}
  if (!res.ok) throw data || { message: res.statusText };
  return data;
}
