import { useEffect, useState } from "react";
import { Navigate, NavLink, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { api, auth, request } from "./api";
import { RESOURCES, ABOUT_FIELDS } from "./resources";
import { Field, Notice } from "./components";

/* ------------------------------------------------------------- Login */
function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (auth.isLoggedIn()) return <Navigate to="/" replace />;
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError("");
    try { auth.save(await request("/auth/login", { method: "POST", body: { email, password } })); nav("/"); }
    catch (x) { setError(x.message); }
    setBusy(false);
  };
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 shadow">
        <h1 className="text-xl font-bold">Portfolio CMS</h1>
        <p className="text-sm text-slate-500">Sign in to manage your content.</p>
        <Notice>{error}</Notice>
        <div><label className="mb-1 block text-sm font-medium">Email</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="mb-1 block text-sm font-medium">Password</label>
          <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <button className="btn w-full justify-center" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------- Layout */
function Layout() {
  const nav = useNavigate();
  if (!auth.isLoggedIn()) return <Navigate to="/login" replace />;
  const link = ({ isActive }) => `block rounded-md px-3 py-2 text-sm font-medium ${isActive ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"}`;
  const items = [["/", "Dashboard"], ["/about", "About"], ...Object.entries(RESOURCES).map(([k, r]) => [`/${k}`, r.label]), ["/messages", "Messages"], ["/media", "Media"]];
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="bg-slate-900 p-4 md:w-56 md:shrink-0">
        <div className="mb-4 text-lg font-bold text-white">Portfolio CMS</div>
        <nav className="flex flex-wrap gap-1 md:block md:space-y-1">
          {items.map(([to, label]) => <NavLink key={to} to={to} end={to === "/"} className={link}>{label}</NavLink>)}
        </nav>
        <button className="mt-4 text-sm text-slate-400 hover:text-white" onClick={() => { auth.clear(); nav("/login"); }}>Log out</button>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8"><Outlet /></main>
    </div>
  );
}

/* ------------------------------------------------------------- Dashboard */
function Dashboard() {
  const [s, setS] = useState(null); const [error, setError] = useState("");
  useEffect(() => { request("/stats").then(setS).catch((e) => setError(e.message)); }, []);
  return (
    <div><h1 className="mb-6 text-2xl font-bold">Dashboard</h1><Notice>{error}</Notice>
      {s && <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Object.entries(s).map(([k, v]) => (
          <div key={k} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="text-3xl font-bold">{v}</div>
            <div className="mt-1 text-sm capitalize text-slate-500">{k.replace("_", " ")}</div>
          </div>))}
      </div>}
    </div>
  );
}

/* ------------------------------------------------------------- About */
function About() {
  const [d, setD] = useState(null); const [msg, setMsg] = useState(""); const [error, setError] = useState("");
  useEffect(() => { api.list("about").then(setD).catch((e) => setError(e.message)); }, []);
  const save = async (e) => {
    e.preventDefault(); setMsg(""); setError("");
    try { setD(await request("/about", { method: "PUT", body: d })); setMsg("Saved."); } catch (x) { setError(x.message); }
  };
  if (!d) return <Notice>{error}</Notice>;
  return (
    <form onSubmit={save} className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">About</h1><Notice>{error}</Notice><Notice kind="ok">{msg}</Notice>
      {ABOUT_FIELDS.map((f) => <Field key={f.name} f={f} value={d[f.name]} onChange={(v) => setD({ ...d, [f.name]: v })} />)}
      <button className="btn">Save changes</button>
    </form>
  );
}

/* ------------------------------------------------------------- Generic CRUD */
function Resource({ name }) {
  const cfg = RESOURCES[name];
  const [items, setItems] = useState([]); const [form, setForm] = useState(null);
  const [error, setError] = useState(""); const [msg, setMsg] = useState("");
  const load = () => api.list(name).then(setItems).catch((e) => setError(e.message));
  useEffect(() => { setForm(null); setError(""); setMsg(""); load(); }, [name]);

  const save = async (e) => {
    e.preventDefault(); setError(""); setMsg("");
    try {
      form.id ? await api.update(name, form.id, form) : await api.create(name, form);
      setForm(null); setMsg("Saved."); load();
    } catch (x) { setError(x.message); }
  };
  const del = async (it) => {
    if (!confirm("Delete this item?")) return;
    try { await api.remove(name, it.id); load(); } catch (x) { setError(x.message); }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{cfg.label}</h1>
        {!form && <button className="btn" onClick={() => { setMsg(""); setForm({ ...cfg.defaults }); }}>Add new</button>}
      </div>
      <Notice>{error}</Notice><Notice kind="ok">{msg}</Notice>
      {form ? (
        <form onSubmit={save} className="max-w-2xl space-y-4 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold">{form.id ? "Edit" : "New"} item</h2>
          {cfg.fields.map((f) => <Field key={f.name} f={f} value={form[f.name]} onChange={(v) => setForm({ ...form, [f.name]: v })} />)}
          <div className="flex gap-2"><button className="btn">Save</button>
            <button type="button" className="btn-ghost" onClick={() => setForm(null)}>Cancel</button></div>
        </form>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-500"><tr>
              {cfg.columns.map((c) => <th key={c} className="px-4 py-3 font-medium capitalize">{c.replace("_", " ")}</th>)}<th className="px-4 py-3" /></tr></thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b last:border-0">
                  {cfg.columns.map((c) => <td key={c} className="px-4 py-3">{typeof it[c] === "boolean" ? (it[c] ? "Yes" : "No") : String(it[c] ?? "")}</td>)}
                  <td className="space-x-2 whitespace-nowrap px-4 py-3 text-right">
                    <button className="btn-ghost" onClick={() => { setMsg(""); setForm(it); }}>Edit</button>
                    <button className="btn-danger" onClick={() => del(it)}>Delete</button></td>
                </tr>))}
              {!items.length && <tr><td colSpan={cfg.columns.length + 1} className="px-4 py-8 text-center text-slate-500">Nothing here yet. Select “Add new” to create the first item.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- Messages */
function Messages() {
  const [items, setItems] = useState([]); const [error, setError] = useState("");
  const load = () => api.list("messages").then(setItems).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);
  const toggle = async (m) => { await api.update("messages", m.id, { is_read: !m.is_read }); load(); };
  const del = async (m) => { if (confirm("Delete this message?")) { await api.remove("messages", m.id); load(); } };
  return (
    <div><h1 className="mb-6 text-2xl font-bold">Messages</h1><Notice>{error}</Notice>
      <div className="space-y-3">
        {items.map((m) => (
          <div key={m.id} className={`rounded-xl bg-white p-5 shadow-sm ${m.is_read ? "opacity-70" : "border-l-4 border-indigo-500"}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div><span className="font-semibold">{m.name}</span> <a className="text-sm text-indigo-600" href={`mailto:${m.email}`}>{m.email}</a></div>
              <span className="text-xs text-slate-500">{new Date(m.created_at).toLocaleString()}</span></div>
            {m.subject && <div className="mt-1 font-medium">{m.subject}</div>}
            <p className="mt-2 whitespace-pre-wrap text-sm">{m.message}</p>
            <div className="mt-3 flex gap-2"><button className="btn-ghost" onClick={() => toggle(m)}>Mark as {m.is_read ? "unread" : "read"}</button>
              <button className="btn-danger" onClick={() => del(m)}>Delete</button></div>
          </div>))}
        {!items.length && <p className="text-slate-500">No messages yet. Contact form submissions will appear here.</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Media */
function Media() {
  const [items, setItems] = useState([]); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const load = () => api.list("media").then(setItems).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);
  const up = async (e) => {
    const file = e.target.files[0]; if (!file) return; setBusy(true); setError("");
    try { await api.upload(file); load(); } catch (x) { setError(x.message); }
    setBusy(false); e.target.value = "";
  };
  return (
    <div>
      <div className="mb-6 flex items-center justify-between"><h1 className="text-2xl font-bold">Media</h1>
        <label className="btn cursor-pointer">{busy ? "Uploading…" : "Upload image"}<input type="file" accept="image/*,.pdf" hidden onChange={up} /></label></div>
      <Notice>{error}</Notice>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((m) => (
          <div key={m.id} className="rounded-xl bg-white p-3 shadow-sm">
            <img src={m.url} alt="" className="h-32 w-full rounded object-cover bg-slate-100" />
            <div className="mt-2 flex items-center justify-between gap-2">
              <button className="btn-ghost" onClick={() => navigator.clipboard?.writeText(m.url)}>Copy URL</button>
              <button className="btn-danger" onClick={async () => { await api.remove("media", m.id); load(); }}>Delete</button></div>
          </div>))}
      </div>
      {!items.length && <p className="text-slate-500">No uploads yet.</p>}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="about" element={<About />} />
        {Object.keys(RESOURCES).map((k) => <Route key={k} path={k} element={<Resource name={k} />} />)}
        <Route path="messages" element={<Messages />} />
        <Route path="media" element={<Media />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
