// Each entry drives a CRUD screen. type: text | textarea | number | bool | image | url
export const RESOURCES = {
  skills: { label: "Skills", fields: [
    { name: "name", label: "Name", required: true }, { name: "category", label: "Category" },
    { name: "level", label: "Level (0-100)", type: "number" }], columns: ["name", "category", "level"], defaults: { level: 80, category: "General" } },
  projects: { label: "Projects", fields: [
    { name: "title", label: "Title", required: true }, { name: "description", label: "Description", type: "textarea" },
    { name: "image", label: "Image", type: "image" }, { name: "tech", label: "Tech (comma separated)" },
    { name: "live_url", label: "Live URL", type: "url" }, { name: "repo_url", label: "Repository URL", type: "url" },
    { name: "featured", label: "Featured", type: "bool" }], columns: ["title", "tech", "featured"], defaults: {} },
  blogs: { label: "Blogs", fields: [
    { name: "title", label: "Title", required: true }, { name: "slug", label: "Slug (auto if empty)" },
    { name: "excerpt", label: "Excerpt", type: "textarea" }, { name: "content", label: "Content", type: "textarea", rows: 12 },
    { name: "cover", label: "Cover image", type: "image" }, { name: "published", label: "Published", type: "bool" }],
    columns: ["title", "slug", "published"], defaults: { published: true } },
  experience: { label: "Experience", fields: [
    { name: "role", label: "Role", required: true }, { name: "company", label: "Company" },
    { name: "start_date", label: "Start (YYYY-MM)" }, { name: "end_date", label: "End (empty = present)" },
    { name: "description", label: "Description", type: "textarea" }], columns: ["role", "company", "start_date", "end_date"], defaults: {} },
  testimonials: { label: "Testimonials", fields: [
    { name: "name", label: "Name", required: true }, { name: "role", label: "Role / company" },
    { name: "message", label: "Message", type: "textarea", required: true }, { name: "avatar", label: "Avatar", type: "image" }],
    columns: ["name", "role"], defaults: {} },
  services: { label: "Services", fields: [
    { name: "title", label: "Title", required: true }, { name: "description", label: "Description", type: "textarea" },
    { name: "icon", label: "Icon (emoji)" }], columns: ["title", "icon"], defaults: {} },
};

export const ABOUT_FIELDS = [
  { name: "name", label: "Full name" }, { name: "title", label: "Headline / job title" },
  { name: "bio", label: "Bio", type: "textarea", rows: 6 }, { name: "photo", label: "Photo", type: "image" },
  { name: "email", label: "Public email" }, { name: "location", label: "Location" },
  { name: "github", label: "GitHub URL", type: "url" }, { name: "linkedin", label: "LinkedIn URL", type: "url" },
  { name: "twitter", label: "Twitter / X URL", type: "url" }, { name: "resume_url", label: "Resume URL", type: "url" },
];
