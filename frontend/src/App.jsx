import { useEffect, useState } from "react";
import { Link, Route, Routes, useLocation, useParams } from "react-router-dom";
import { getBlog, getBlogs, getContent, sendContact } from "./api";

function usePageMeta(title, description) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) document.querySelector('meta[name="description"]')?.setAttribute("content", description.slice(0, 160));
  }, [title, description]);
}

const fmtDate = (d) => (d ? new Date(d + (d.length === 7 ? "-01" : "")).toLocaleDateString("en", { month: "short", year: "numeric" }) : "Present");

/* ---------------------------------------------------------- shared */
function Section({ id, label, children }) {
  return (
    <section id={id} className="border-t border-rule">
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-16 md:grid-cols-[11rem_1fr] md:gap-12">
        <h2 className="font-display text-xl font-bold md:sticky md:top-20 md:self-start">{label}</h2>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}
const Status = ({ error }) => <p className="p-10 text-center text-muted">{error || "Loading…"}</p>;

function Header({ about }) {
  const { pathname } = useLocation();
  const base = pathname === "/" ? "" : "/";
  const links = [["projects", "Projects"], ["skills", "Skills"], ["experience", "Experience"], ["blog", "Blog"], ["contact", "Contact"]];
  return (
    <header className="sticky top-0 z-10 border-b border-rule bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link to="/" className="font-display text-lg font-extrabold">{about?.name || "Portfolio"}</Link>
        <nav className="flex gap-4 text-sm font-medium sm:gap-6">
          {links.map(([id, l]) => <a key={id} href={`${base}#${id}`} className="hover:text-cobalt">{l}</a>)}
        </nav>
      </div>
    </header>
  );
}

function Footer({ about }) {
  return (
    <footer className="border-t border-rule py-8 text-center text-sm text-muted">
      © {new Date().getFullYear()} {about?.name}
    </footer>
  );
}

/* ---------------------------------------------------------- home sections */
function Hero({ a }) {
  usePageMeta(`${a.name} – ${a.title}`, a.bio);
  const links = [["GitHub", a.github], ["LinkedIn", a.linkedin], ["Twitter", a.twitter], ["Resume", a.resume_url]].filter(([, u]) => u);
  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-16 md:pt-24">
      <div className="grid items-end gap-10 md:grid-cols-[1fr_16rem]">
        <div>
          <p className="mb-4 text-lg text-muted">{a.title}</p>
          <h1 className="font-display text-[clamp(3rem,10vw,7.5rem)] font-extrabold leading-[0.92] tracking-tight">{a.name}</h1>
          <p className="mt-8 max-w-xl whitespace-pre-line text-lg leading-relaxed">{a.bio}</p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-medium">
            {a.email && <a className="text-cobalt underline underline-offset-4" href={`mailto:${a.email}`}>{a.email}</a>}
            {links.map(([l, u]) => <a key={l} className="underline underline-offset-4 hover:text-cobalt" href={u} target="_blank" rel="noreferrer">{l}</a>)}
          </div>
          {a.location && <p className="mt-3 text-sm text-muted">{a.location}</p>}
        </div>
        {a.photo && <img src={a.photo} alt={a.name} className="aspect-[4/5] w-full max-w-xs object-cover md:justify-self-end" />}
      </div>
    </div>
  );
}

const Services = ({ items }) => items.length > 0 && (
  <Section id="services" label="What I do">
    <div className="grid gap-8 sm:grid-cols-2">
      {items.map((s) => (
        <div key={s.id}><h3 className="font-display text-lg font-bold">{s.icon} {s.title}</h3>
          <p className="mt-2 text-muted">{s.description}</p></div>))}
    </div>
  </Section>
);

const Projects = ({ items }) => (
  <Section id="projects" label="Projects">
    {!items.length && <p className="text-muted">Projects will appear here.</p>}
    <div className="grid gap-10 sm:grid-cols-2">
      {items.map((p) => (
        <article key={p.id}>
          {p.image && <img src={p.image} alt="" loading="lazy" className="mb-4 aspect-video w-full object-cover" />}
          <h3 className="font-display text-xl font-bold">{p.title}{p.featured && <span className="ml-2 align-middle text-xs font-semibold text-cobalt">Featured</span>}</h3>
          <p className="mt-2 text-muted">{p.description}</p>
          {p.tech && <p className="mt-3 text-sm font-medium">{p.tech.split(",").map((t) => t.trim()).filter(Boolean).join(", ")}</p>}
          <div className="mt-3 flex gap-4 text-sm font-semibold">
            {p.live_url && <a className="text-cobalt underline underline-offset-4" href={p.live_url} target="_blank" rel="noreferrer">Live site</a>}
            {p.repo_url && <a className="underline underline-offset-4" href={p.repo_url} target="_blank" rel="noreferrer">Source code</a>}
          </div>
        </article>))}
    </div>
  </Section>
);

function Skills({ items }) {
  const groups = items.reduce((m, s) => ((m[s.category || "Other"] ||= []).push(s), m), {});
  return (
    <Section id="skills" label="Skills">
      <div className="grid gap-10 sm:grid-cols-2">
        {Object.entries(groups).map(([cat, list]) => (
          <div key={cat}><h3 className="mb-3 font-display font-bold">{cat}</h3>
            <ul className="space-y-3">
              {list.map((s) => (
                <li key={s.id}><div className="flex justify-between text-sm"><span>{s.name}</span><span className="text-muted">{s.level}%</span></div>
                  <div className="mt-1 h-1 bg-rule" role="presentation"><div className="h-1 bg-cobalt" style={{ width: `${Math.min(100, s.level)}%` }} /></div></li>))}
            </ul></div>))}
      </div>
    </Section>
  );
}

const Experience = ({ items }) => items.length > 0 && (
  <Section id="experience" label="Experience">
    <ol className="space-y-8 border-l-2 border-rule pl-6">
      {items.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[1.9rem] top-2 h-3 w-3 rounded-full bg-cobalt" />
          <p className="text-sm text-muted">{fmtDate(e.start_date)} – {fmtDate(e.end_date)}</p>
          <h3 className="font-display text-lg font-bold">{e.role}{e.company && `, ${e.company}`}</h3>
          <p className="mt-1 text-muted">{e.description}</p>
        </li>))}
    </ol>
  </Section>
);

const Testimonials = ({ items }) => items.length > 0 && (
  <Section id="testimonials" label="Kind words">
    <div className="grid gap-10 sm:grid-cols-2">
      {items.map((t) => (
        <figure key={t.id}>
          <blockquote className="text-lg leading-relaxed">“{t.message}”</blockquote>
          <figcaption className="mt-3 flex items-center gap-3 text-sm">
            {t.avatar && <img src={t.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />}
            <span><strong>{t.name}</strong>{t.role && <span className="text-muted"> · {t.role}</span>}</span>
          </figcaption>
        </figure>))}
    </div>
  </Section>
);

const BlogPreview = ({ items }) => (
  <Section id="blog" label="Writing">
    {!items.length && <p className="text-muted">No posts yet.</p>}
    <ul className="divide-y divide-rule">
      {items.slice(0, 4).map((b) => <PostRow key={b.id} b={b} />)}
    </ul>
    {items.length > 4 && <Link to="/blog" className="mt-6 inline-block font-semibold text-cobalt underline underline-offset-4">All posts</Link>}
  </Section>
);

const PostRow = ({ b }) => (
  <li className="py-5">
    <Link to={`/blog/${b.slug}`} className="group block">
      <p className="text-sm text-muted">{new Date(b.created_at).toLocaleDateString("en", { dateStyle: "medium" })}</p>
      <h3 className="font-display text-xl font-bold group-hover:text-cobalt">{b.title}</h3>
      <p className="mt-1 text-muted">{b.excerpt}</p>
    </Link>
  </li>
);

function Contact({ email }) {
  const empty = { name: "", email: "", subject: "", message: "" };
  const [f, setF] = useState(empty); const [state, setState] = useState({ busy: false, error: "", ok: false });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setState({ busy: true, error: "", ok: false });
    try { await sendContact(f); setF(empty); setState({ busy: false, error: "", ok: true }); }
    catch (x) { setState({ busy: false, error: x.message, ok: false }); }
  };
  return (
    <Section id="contact" label="Contact">
      <form onSubmit={submit} className="max-w-xl space-y-5">
        <p className="text-lg">Have a project in mind? Send a message{email && <> or write to <a className="text-cobalt underline" href={`mailto:${email}`}>{email}</a></>}.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium">Name<input required className="input" value={f.name} onChange={set("name")} /></label>
          <label className="block text-sm font-medium">Email<input required type="email" className="input" value={f.email} onChange={set("email")} /></label>
        </div>
        <label className="block text-sm font-medium">Subject<input className="input" value={f.subject} onChange={set("subject")} /></label>
        <label className="block text-sm font-medium">Message<textarea required rows={5} className="input" value={f.message} onChange={set("message")} /></label>
        <button disabled={state.busy} className="bg-ink px-6 py-3 font-semibold text-paper hover:bg-cobalt disabled:opacity-50">{state.busy ? "Sending…" : "Send message"}</button>
        {state.ok && <p role="status" className="font-medium text-green-700">Message sent. Thank you, I will reply soon.</p>}
        {state.error && <p role="alert" className="font-medium text-red-700">{state.error}</p>}
      </form>
    </Section>
  );
}

/* ---------------------------------------------------------- pages */
function Home() {
  const [d, setD] = useState(null); const [error, setError] = useState("");
  useEffect(() => { getContent().then(setD).catch(() => setError("Could not load content. Make sure the backend is running.")); }, []);
  const { hash } = useLocation();
  useEffect(() => { if (d && hash) document.querySelector(hash)?.scrollIntoView(); }, [d, hash]);
  if (!d) return <Status error={error} />;
  return (
    <>
      <Header about={d.about} />
      <main>
        <Hero a={d.about} />
        <Services items={d.services} /><Projects items={d.projects} /><Skills items={d.skills} />
        <Experience items={d.experience} /><Testimonials items={d.testimonials} />
        <BlogPreview items={d.blogs} /><Contact email={d.about.email} />
      </main>
      <Footer about={d.about} />
    </>
  );
}

function BlogList() {
  const [items, setItems] = useState(null); const [error, setError] = useState("");
  usePageMeta("Blog", "Articles and notes.");
  useEffect(() => { getBlogs().then(setItems).catch((e) => setError(e.message)); }, []);
  return (
    <><Header /><main className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="mb-8 font-display text-4xl font-extrabold">Blog</h1>
      {!items ? <Status error={error} /> : <ul className="divide-y divide-rule">{items.map((b) => <PostRow key={b.id} b={b} />)}</ul>}
    </main></>
  );
}

function BlogPost() {
  const { slug } = useParams(); const [b, setB] = useState(null); const [error, setError] = useState("");
  usePageMeta(b?.title, b?.excerpt);
  useEffect(() => { setB(null); getBlog(slug).then(setB).catch(() => setError("Post not found.")); }, [slug]);
  return (
    <><Header /><main className="mx-auto max-w-2xl px-5 py-16">
      <Link to="/blog" className="text-sm font-semibold text-cobalt underline underline-offset-4">All posts</Link>
      {!b ? <Status error={error} /> : (
        <article className="mt-6">
          <p className="text-sm text-muted">{new Date(b.created_at).toLocaleDateString("en", { dateStyle: "long" })}</p>
          <h1 className="mt-1 font-display text-4xl font-extrabold leading-tight">{b.title}</h1>
          {b.cover && <img src={b.cover} alt="" className="mt-8 w-full" />}
          <div className="mt-8 space-y-5 text-lg leading-relaxed">{b.content.split(/\n{2,}/).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}</div>
        </article>)}
    </main></>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/blog" element={<BlogList />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
