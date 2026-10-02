const API = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

async function req(path, opts) {
  const res = await fetch(API + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const getContent = async () => {
  const [about, services, projects, skills, experience, testimonials, blogs] = await Promise.all(
    ["about", "services", "projects", "skills", "experience", "testimonials", "blogs"].map((p) => req("/" + p)));
  return { about, services, projects, skills, experience, testimonials, blogs };
};
export const getBlogs = () => req("/blogs");
export const getBlog = (slug) => req("/blogs/" + slug);
export const sendContact = (body) =>
  req("/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
