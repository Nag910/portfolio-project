import { useState } from "react";
import { api } from "./api";

export function Field({ f, value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const v = value ?? "";
  const label = <label className="mb-1 block text-sm font-medium">{f.label}{f.required && <span className="text-red-500"> *</span>}</label>;
  if (f.type === "bool")
    return <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> {f.label}</label>;
  if (f.type === "textarea")
    return <div>{label}<textarea className="input" rows={f.rows || 4} value={v} onChange={(e) => onChange(e.target.value)} /></div>;
  if (f.type === "image")
    return (
      <div>{label}
        <div className="flex items-center gap-3">
          {v && <img src={v} alt="" className="h-14 w-14 rounded object-cover border" />}
          <input className="input" placeholder="Image URL or upload" value={v} onChange={(e) => onChange(e.target.value)} />
          <label className="btn-ghost cursor-pointer whitespace-nowrap">{busy ? "Uploading…" : "Upload"}
            <input type="file" accept="image/*" hidden onChange={async (e) => {
              const file = e.target.files[0]; if (!file) return;
              setBusy(true); setErr("");
              try { onChange((await api.upload(file)).url); } catch (x) { setErr(x.message); }
              setBusy(false); e.target.value = "";
            }} /></label>
        </div>
        {err && <p className="mt-1 text-sm text-red-600">{err}</p>}
      </div>
    );
  return <div>{label}<input className="input" type={f.type === "number" ? "number" : "text"} value={v}
    onChange={(e) => onChange(f.type === "number" ? Number(e.target.value) : e.target.value)} /></div>;
}

export function Notice({ kind = "error", children }) {
  if (!children) return null;
  const c = kind === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200";
  return <div role="alert" className={`mb-4 rounded-md border px-3 py-2 text-sm ${c}`}>{children}</div>;
}
