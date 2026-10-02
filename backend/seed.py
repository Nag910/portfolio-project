"""Optional: fill the CMS with sample content.  Run: python seed.py"""
from app import create_app
from app.models import db, About, Skill, Project, Blog, Experience, Testimonial, Service

app = create_app()
with app.app_context():
    if Skill.query.count():
        print("Already seeded."); raise SystemExit
    a = About.query.first()
    a.update(dict(name="Alex Rivera", title="Full-stack developer",
                  bio="I build fast, accessible web apps with Python and React. I like clear APIs, small teams and shipping weekly.",
                  email="alex@example.com", location="Bengaluru, India",
                  github="https://github.com", linkedin="https://linkedin.com"))
    db.session.add_all([
        Skill(name="Python", category="Backend", level=90), Skill(name="Flask", category="Backend", level=85),
        Skill(name="PostgreSQL", category="Backend", level=75), Skill(name="React", category="Frontend", level=85),
        Skill(name="Tailwind CSS", category="Frontend", level=80),
        Project(title="Inventory Tracker", description="Stock management app for small shops with barcode scanning.",
                tech="Flask,React,PostgreSQL", featured=True, repo_url="https://github.com"),
        Project(title="Weather Board", description="Live weather dashboard with 7-day charts.", tech="React,Tailwind",
                live_url="https://example.com"),
        Blog(title="Why I built my own CMS", slug="why-i-built-my-own-cms", excerpt="Lessons from building a CMS from scratch.",
             content="Building a CMS teaches you auth, validation and data modelling.\n\nIt also gives you full control over your content."),
        Experience(role="Software Engineer", company="Acme Corp", start_date="2022-06", end_date="", description="Built internal tools and REST APIs."),
        Experience(role="Intern", company="Startup Labs", start_date="2021-01", end_date="2021-08", description="Frontend work in React."),
        Testimonial(name="Priya S.", role="Product Manager", message="Delivered ahead of schedule and the code was easy to maintain."),
        Service(title="Web development", description="Responsive sites and web apps, end to end."),
        Service(title="API design", description="Clean, documented REST APIs."),
    ])
    db.session.commit()
    print("Seeded.")
