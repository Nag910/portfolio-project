import os
import re
import smtplib
import uuid
from email.message import EmailMessage

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import (create_access_token, create_refresh_token,
                                get_jwt_identity, jwt_required,
                                verify_jwt_in_request)
from werkzeug.utils import secure_filename

from .models import (About, Blog, Experience, Media, Message, Project, Service,
                     Skill, Testimonial, User, db)

bp = Blueprint("api", __name__)
ALLOWED_EXT = {"png", "jpg", "jpeg", "gif", "webp", "svg", "pdf"}


def err(msg, code=400):
    return jsonify(error=msg), code


# ---------------------------------------------------------------- Auth
@bp.post("/auth/login")
def login():
    d = request.get_json(silent=True) or {}
    user = User.query.filter_by(email=(d.get("email") or "").strip()).first()
    if not user or not user.check_password(d.get("password") or ""):
        return err("Invalid email or password", 401)
    ident = str(user.id)
    return jsonify(access_token=create_access_token(identity=ident),
                   refresh_token=create_refresh_token(identity=ident),
                   user={"id": user.id, "email": user.email})


@bp.post("/auth/refresh")
@jwt_required(refresh=True)
def refresh():
    return jsonify(access_token=create_access_token(identity=get_jwt_identity()))


@bp.get("/auth/me")
@jwt_required()
def me():
    u = db.session.get(User, int(get_jwt_identity()))
    return jsonify(id=u.id, email=u.email)


# ---------------------------------------------------------------- About (single record)
@bp.get("/about")
def about_get():
    return jsonify(About.query.first().to_dict())


@bp.put("/about")
@jwt_required()
def about_put():
    a = About.query.first()
    a.update(request.get_json(silent=True) or {})
    db.session.commit()
    return jsonify(a.to_dict())


# ---------------------------------------------------------------- Generic CRUD
def slugify(text):
    return re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-") or uuid.uuid4().hex[:8]


def unique_slug(base, ignore_id=None):
    slug, n = base, 2
    while True:
        q = Blog.query.filter_by(slug=slug)
        hit = q.first()
        if not hit or hit.id == ignore_id:
            return slug
        slug, n = f"{base}-{n}", n + 1


def register_crud(path, model, order, required, public_read=True):
    ep = path.strip("/")

    def list_items():
        q = model.query
        if model is Blog:
            try:
                verify_jwt_in_request(optional=True)
                admin = bool(get_jwt_identity())
            except Exception:
                admin = False
            if not admin:
                q = q.filter_by(published=True)
        return jsonify([i.to_dict() for i in q.order_by(*order()).all()])

    def get_item(item_id):
        item = db.session.get(model, item_id) if isinstance(item_id, int) else None
        if item is None and model is Blog:
            item = Blog.query.filter_by(slug=str(item_id)).first()
        if item is None:
            return err("Not found", 404)
        return jsonify(item.to_dict())

    def create():
        d = request.get_json(silent=True) or {}
        for f in required:
            if not str(d.get(f, "")).strip():
                return err(f"'{f}' is required")
        item = model()
        item.update(d)
        if model is Blog:
            item.slug = unique_slug(slugify(d.get("slug") or d.get("title")))
        db.session.add(item)
        db.session.commit()
        return jsonify(item.to_dict()), 201

    def update(item_id):
        item = db.session.get(model, item_id)
        if not item:
            return err("Not found", 404)
        d = request.get_json(silent=True) or {}
        item.update(d)
        if model is Blog:
            item.slug = unique_slug(slugify(item.slug or item.title), item.id)
        db.session.commit()
        return jsonify(item.to_dict())

    def delete(item_id):
        item = db.session.get(model, item_id)
        if not item:
            return err("Not found", 404)
        db.session.delete(item)
        db.session.commit()
        return jsonify(deleted=True)

    if public_read:
        bp.add_url_rule(f"/{ep}", f"{ep}_list", list_items, methods=["GET"])
        bp.add_url_rule(f"/{ep}/<item_id>", f"{ep}_get",
                        lambda item_id: get_item(int(item_id) if item_id.isdigit() else item_id), methods=["GET"])
    else:
        bp.add_url_rule(f"/{ep}", f"{ep}_list", jwt_required()(list_items), methods=["GET"])
    if required is not None:
        bp.add_url_rule(f"/{ep}", f"{ep}_create", jwt_required()(create), methods=["POST"])
    bp.add_url_rule(f"/{ep}/<int:item_id>", f"{ep}_update", jwt_required()(update), methods=["PUT"])
    bp.add_url_rule(f"/{ep}/<int:item_id>", f"{ep}_delete", jwt_required()(delete), methods=["DELETE"])


register_crud("skills", Skill, lambda: [Skill.category, Skill.id], ["name"])
register_crud("projects", Project, lambda: [Project.id.desc()], ["title"])
register_crud("blogs", Blog, lambda: [Blog.created_at.desc()], ["title"])
register_crud("experience", Experience, lambda: [Experience.start_date.desc()], ["role"])
register_crud("testimonials", Testimonial, lambda: [Testimonial.id.desc()], ["name", "message"])
register_crud("services", Service, lambda: [Service.id], ["title"])
# Messages are private (admin only); creation happens through POST /contact
register_crud("messages", Message, lambda: [Message.created_at.desc()], None, public_read=False)
register_crud("media", Media, lambda: [Media.id.desc()], None, public_read=False)


# ---------------------------------------------------------------- Dashboard stats
@bp.get("/stats")
@jwt_required()
def stats():
    return jsonify({
        "skills": Skill.query.count(), "projects": Project.query.count(),
        "blogs": Blog.query.count(), "experience": Experience.query.count(),
        "testimonials": Testimonial.query.count(), "services": Service.query.count(),
        "messages": Message.query.count(),
        "unread_messages": Message.query.filter_by(is_read=False).count(),
    })


# ---------------------------------------------------------------- Upload
@bp.post("/upload/image")
@jwt_required()
def upload_image():
    f = request.files.get("file")
    if not f or not f.filename:
        return err("No file provided (field name must be 'file')")
    ext = f.filename.rsplit(".", 1)[-1].lower() if "." in f.filename else ""
    if ext not in ALLOWED_EXT:
        return err(f"File type not allowed. Use: {', '.join(sorted(ALLOWED_EXT))}")
    name = f"{uuid.uuid4().hex[:12]}_{secure_filename(f.filename)}"
    f.save(os.path.join(current_app.config["UPLOAD_FOLDER"], name))
    url = f"{request.host_url.rstrip('/')}/uploads/{name}"
    m = Media(filename=name, url=url)
    db.session.add(m)
    db.session.commit()
    return jsonify(m.to_dict()), 201


# ---------------------------------------------------------------- Contact
def send_email(msg):
    host, to = os.getenv("SMTP_HOST"), os.getenv("MAIL_TO")
    if not host or not to:
        return False
    try:
        em = EmailMessage()
        em["Subject"] = f"[Portfolio] {msg.subject or 'New message'} from {msg.name}"
        em["From"] = os.getenv("SMTP_USER") or to
        em["To"] = to
        em["Reply-To"] = msg.email
        em.set_content(f"From: {msg.name} <{msg.email}>\n\n{msg.message}")
        with smtplib.SMTP(host, int(os.getenv("SMTP_PORT", 587)), timeout=10) as s:
            s.starttls()
            if os.getenv("SMTP_USER"):
                s.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASSWORD", ""))
            s.send_message(em)
        return True
    except Exception as e:  # never fail the request because mail is down
        current_app.logger.warning("Email send failed: %s", e)
        return False


@bp.post("/contact")
def contact():
    d = request.get_json(silent=True) or {}
    name, email, body = (d.get(k, "").strip() for k in ("name", "email", "message"))
    if not name or not body:
        return err("Name and message are required")
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        return err("Enter a valid email address")
    m = Message(name=name, email=email, subject=d.get("subject", "").strip(), message=body)
    db.session.add(m)
    db.session.commit()
    emailed = send_email(m)
    return jsonify(ok=True, emailed=emailed), 201
