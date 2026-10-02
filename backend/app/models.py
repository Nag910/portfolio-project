from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class Base(db.Model):
    """Abstract base: every content model lists its editable FIELDS."""
    __abstract__ = True
    FIELDS = []
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        data = {"id": self.id, "created_at": self.created_at.isoformat() if self.created_at else None}
        for f in self.FIELDS:
            v = getattr(self, f)
            data[f] = v.isoformat() if isinstance(v, datetime) else v
        return data

    def update(self, data):
        for f in self.FIELDS:
            if f in data:
                setattr(self, f, data[f])


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    def set_password(self, pw):
        self.password_hash = generate_password_hash(pw)

    def check_password(self, pw):
        return check_password_hash(self.password_hash, pw)


class About(Base):
    __tablename__ = "about"
    FIELDS = ["name", "title", "bio", "photo", "email", "location", "github", "linkedin", "twitter", "resume_url"]
    name = db.Column(db.String(120), default="")
    title = db.Column(db.String(160), default="")
    bio = db.Column(db.Text, default="")
    photo = db.Column(db.String(500), default="")
    email = db.Column(db.String(255), default="")
    location = db.Column(db.String(160), default="")
    github = db.Column(db.String(300), default="")
    linkedin = db.Column(db.String(300), default="")
    twitter = db.Column(db.String(300), default="")
    resume_url = db.Column(db.String(500), default="")


class Skill(Base):
    __tablename__ = "skills"
    FIELDS = ["name", "category", "level"]
    name = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(120), default="General")
    level = db.Column(db.Integer, default=80)


class Project(Base):
    __tablename__ = "projects"
    FIELDS = ["title", "description", "image", "tech", "live_url", "repo_url", "featured"]
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default="")
    image = db.Column(db.String(500), default="")
    tech = db.Column(db.String(500), default="")  # comma separated
    live_url = db.Column(db.String(500), default="")
    repo_url = db.Column(db.String(500), default="")
    featured = db.Column(db.Boolean, default=False)


class Blog(Base):
    __tablename__ = "blogs"
    FIELDS = ["title", "slug", "excerpt", "content", "cover", "published"]
    title = db.Column(db.String(250), nullable=False)
    slug = db.Column(db.String(250), unique=True)
    excerpt = db.Column(db.Text, default="")
    content = db.Column(db.Text, default="")
    cover = db.Column(db.String(500), default="")
    published = db.Column(db.Boolean, default=True)


class Experience(Base):
    __tablename__ = "experience"
    FIELDS = ["role", "company", "start_date", "end_date", "description"]
    role = db.Column(db.String(200), nullable=False)
    company = db.Column(db.String(200), default="")
    start_date = db.Column(db.String(30), default="")
    end_date = db.Column(db.String(30), default="")  # empty = present
    description = db.Column(db.Text, default="")


class Testimonial(Base):
    __tablename__ = "testimonials"
    FIELDS = ["name", "role", "message", "avatar"]
    name = db.Column(db.String(160), nullable=False)
    role = db.Column(db.String(200), default="")
    message = db.Column(db.Text, default="")
    avatar = db.Column(db.String(500), default="")


class Service(Base):
    __tablename__ = "services"
    FIELDS = ["title", "description", "icon"]
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default="")
    icon = db.Column(db.String(60), default="")


class Message(Base):
    __tablename__ = "messages"
    FIELDS = ["name", "email", "subject", "message", "is_read"]
    name = db.Column(db.String(160), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    subject = db.Column(db.String(250), default="")
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)


class Media(Base):
    __tablename__ = "media"
    FIELDS = ["filename", "url"]
    filename = db.Column(db.String(300), nullable=False)
    url = db.Column(db.String(600), nullable=False)
