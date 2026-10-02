export const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const get = (k) => localStorage.getItem(k);

export const auth = {
  isLoggedIn: () => !!get("access_token"),
  save: (d) => { localStorage.setItem("access_token", d.access_token); if (d.refresh_token) localStorage.setItem("refresh_token", d.refresh_token); },
  clear: () => { localStorage.removeItem("access_token"); localStorage.removeItem("refresh_token"); },
};

async function refreshToken() {
  const rt = get("refresh_token");
  if (!rt) return false;
  const r = await fetch(`${API}/auth/refresh`, { method: "POST", headers: { Authorization: `Bearer ${rt}` } });
  if (!r.ok) return false;
  auth.save(await r.json());
  return true;
}

export async function request(path, { method = "GET", body, form } = {}, retry = true) {
  const headers = {};
  const token = get("access_token");
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  let res;
  try {
    res = await fetch(`${API}${path}`, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) });
  } catch {
    throw new Error("Cannot reach the API. Is the backend running on " + API + "?");
  }
  if ((res.status === 401 || res.status === 422) && retry && path !== "/auth/login") {
    if (await refreshToken()) return request(path, { method, body, form }, false);
    auth.clear();
    window.location.hash = "#/login";
    throw new Error("Session expired. Please sign in again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.msg || `Request failed (${res.status})`);
  return data;
}

export const api = {
  list: (r) => request(`/${r}`),
  create: (r, body) => request(`/${r}`, { method: "POST", body }),
  update: (r, id, body) => request(`/${r}/${id}`, { method: "PUT", body }),
  remove: (r, id) => request(`/${r}/${id}`, { method: "DELETE" }),
  upload: (file) => { const form = new FormData(); form.append("file", file); return request("/upload/image", { method: "POST", form }); },
};
