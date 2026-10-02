# Portfolio with a custom-built CMS

Three parts, matching the project document:

| Folder | What it is | Stack | Port |
|---|---|---|---|
| `backend/` | CMS API: JWT auth, CRUD, uploads, contact form | Flask, SQLAlchemy (SQLite or PostgreSQL) | 5000 |
| `admin-panel/` | Admin dashboard to manage all content | React, Vite, Tailwind | 5174 |
| `frontend/` | Public portfolio website | React, Vite, Tailwind | 5173 |

## Run it locally (3 terminals)

**1. Backend** (Python 3.10+)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # then edit the secrets and admin password
python seed.py                   # optional: adds sample content
python run.py                    # http://localhost:5000
```
The first start creates the database tables and an admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`
(default `admin@example.com` / `admin12345`; change it).

**2. Admin panel**
```bash
cd admin-panel
npm install
npm run dev                      # http://localhost:5174
```

**3. Portfolio site**
```bash
cd frontend
npm install
npm run dev                      # http://localhost:5173
```
Sign in to the admin panel, edit your content, and refresh the portfolio site to see it.

## API reference

| Area | Endpoints | Access |
|---|---|---|
| Auth | `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me` | public / refresh token / admin |
| About | `GET /about`, `PUT /about` | read public, write admin |
| Content | `/skills`, `/projects`, `/blogs`, `/experience`, `/testimonials`, `/services`: GET list, GET `/<id>`, POST, PUT `/<id>`, DELETE `/<id>` | read public, write admin |
| Blogs | `GET /blogs/<slug>` also works; drafts are hidden unless an admin token is sent | |
| Upload | `POST /upload/image` (multipart field `file`); files are served at `/uploads/<name>` | admin |
| Media | `GET /media`, `DELETE /media/<id>` | admin |
| Contact | `POST /contact` saves the message and emails it if SMTP is set | public |
| Messages | `GET /messages`, `PUT /messages/<id>`, `DELETE /messages/<id>` | admin |
| Stats | `GET /stats` | admin |

Database tables: `users, about, skills, projects, blogs, experience, testimonials, services, messages, media`.

## Configuration

* **Database:** set `DATABASE_URL` in `backend/.env`. SQLite works out of the box;
  for PostgreSQL use `postgresql://user:pass@host:5432/dbname`.
* **Contact email:** fill `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_TO`.
  Without them, messages are still saved and appear in the admin panel.
* **Frontends:** set `VITE_API_URL` in `frontend/.env` and `admin-panel/.env` to your backend URL.
* **CORS:** list the frontend origins in `CORS_ORIGINS` (comma separated).

## Deploy

1. **Backend** (Render or Railway): root `backend/`, build `pip install -r requirements.txt`,
   start `gunicorn run:app`. Set the env vars from `.env.example`, use a managed PostgreSQL
   `DATABASE_URL`, and add your deployed frontend URLs to `CORS_ORIGINS`.
   Uploads are stored on local disk; on hosts with ephemeral disks, attach a persistent volume.
2. **Admin panel** and **portfolio site** (Vercel or Netlify): build `npm run build`, output `dist`,
   env `VITE_API_URL=https://your-backend-url`. `vercel.json` and `public/_redirects` handle client-side routing.

## Before going live

Change `SECRET_KEY`, `JWT_SECRET_KEY` and the admin password, and restrict `CORS_ORIGINS`.
