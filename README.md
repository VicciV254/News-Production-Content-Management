# Broadcast Media — News Production & Content Management

Editorial CMS for broadcast media institutions. Replaces WhatsApp-based script sharing with a full workflow: **write → submit → edit review → approve → publish → archive**.

## Tech Stack

- **Backend:** Django 6.0, Django REST Framework, SQLite, bleach (HTML sanitization), django-background-tasks
- **Frontend:** React 18, Vite, React Router, React Quill, Recharts, Lucide Icons, DOMPurify

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm

## Quick Start

### 1. Backend

```bash
cd broadcast-media/backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

API runs at **http://127.0.0.1:8000**

#### Background tasks (deadline reminder emails)

In a second terminal (with venv activated):

```bash
python manage.py process_tasks
```

This processes the recurring task that emails journalists 1 hour before submission deadlines.

### 2. Frontend

```bash
cd broadcast-media/frontend
npm install
npm run dev
```

App runs at **http://localhost:5173** (proxies `/api` to Django).

## Demo Accounts

| Username     | Password     | Role       |
|-------------|--------------|------------|
| journalist1 | password123  | Journalist |
| journalist2 | password123  | Journalist |
| editor1     | password123  | Editor     |
| admin       | password123  | Admin      |

## API Endpoints

| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/v1/news/feed/` | Public |
| GET | `/api/v1/news/feed/{slug}/` | Public |
| GET | `/api/v1/news/categories/` | Public |
| GET/POST | `/api/v1/news/stories/` | Authenticated |
| GET/PATCH/DELETE | `/api/v1/news/stories/{id}/` | Owner or Editor |
| POST | `/api/v1/news/stories/{id}/submit/` | Owner |
| POST | `/api/v1/news/stories/{id}/review/` | Editor/Admin |
| GET | `/api/v1/news/stories/{id}/history/` | Owner or Editor |
| POST | `/api/v1/news/stories/{id}/publish/` | Editor/Admin |
| POST | `/api/v1/news/stories/{id}/archive/` | Editor/Admin or Owner |
| GET/POST | `/api/v1/news/deadlines/` | GET: all; POST: Admin |
| GET | `/api/v1/news/reports/` | Editor/Admin |
| POST | `/api/v1/auth/login/` | Public |

## Application Pages

| Page | Route | Role |
|------|-------|------|
| Public News Feed | `/feed` | Everyone |
| Story Detail | `/feed/:slug` | Everyone |
| My Stories | `/stories` | Journalist+ |
| Story Editor | `/stories/:id/edit` | Journalist+ |
| Editorial Review | `/review` | Editor/Admin |
| Analytics | `/analytics` | Editor/Admin |
| Login | `/login` | Everyone |

## Workflow

1. **Journalist** creates a draft in the Story Editor (rich text, tags, breaking toggle, auto-save every 60s)
2. **Submit for Review** → status becomes `submitted`, confirmation email sent
3. **Editor** reviews in Editorial Review → Approve / Request Changes / Reject (comment required for changes/reject)
4. **Approved** stories can be **Published** to the public feed with one click
5. Stories can be **Archived** for long-term storage

## Email Notifications

Emails print to the console in development (`EMAIL_BACKEND = console`). Notifications sent for:

- Story submitted
- Changes requested (includes reviewer comment)
- Story approved
- Deadline reminder (1 hour before, via background task)

## Production Notes

- Change `SECRET_KEY` and set `DEBUG = False`
- Use PostgreSQL instead of SQLite
- Configure real SMTP in `settings.py`
- Run `process_tasks` via cron or a process manager
- Build frontend: `npm run build` and serve static files or deploy separately
