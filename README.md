# Broadcast Media — News Production & Content Management

A newsroom content management system for broadcast media: journalists write stories, editors review and publish them, and anyone can read the published feed. It is set up for local development only.

## Overview

Journalists draft stories in a rich-text editor with a category, tags and a breaking-news flag, then submit them for review. Editors review submitted stories, approve them, request changes or reject them, and publish approved stories to a public feed that needs no sign-in. Admins manage user accounts, and editors and admins get a monthly analytics table per journalist with PDF downloads. The backend emails journalists when their stories are submitted, approved, sent back for changes or rejected, and reminds them before submission deadlines.

## Getting started

Prerequisites:

- Python 3.12 or later (required by Django 6)
- Node.js `^20.19.0`, `^22.13.0` or `>=24`, with npm (the `engines` ranges of Vite 8 and ESLint 10)

### Backend

```bash
cd backend
python3 -m venv venv          # Windows: python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

The API listens on `http://127.0.0.1:8000`. `seed_data` adds demo categories, broadcast slots, a deadline, stories and accounts.

### Frontend

In a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`. The dev server forwards `/api` requests to the backend.

### Demo accounts

Sign in with one of the accounts `seed_data` creates. They share one password, which `seed_data` prints when it finishes.

| Username | Role |
|---|---|
| `journalist1`, `journalist2` | Journalist |
| `editor1` | Editor |
| `admin` | Admin |

### Deadline reminders

Reminder emails need the task worker. Run it in a third terminal:

```bash
cd backend
source venv/bin/activate      # Windows: venv\Scripts\activate
python manage.py process_tasks
```

All emails are printed to the terminal of the process that sends them instead of being delivered. See [Notifications](docs/workflow.md#notifications).

## Verification

No automated tests are defined. These commands check each part:

| Run in | Command | Passes when |
|---|---|---|
| `backend/`, venv active | `python manage.py check` | Django prints `System check identified no issues` |
| any | `curl http://127.0.0.1:8000/api/v1/news/feed/` | the running API returns a JSON page of published stories |
| `frontend/` | `npm run lint` | ESLint reports no errors |
| `frontend/` | `npm run build` | Vite writes the build to `frontend/dist/` |

## Tech stack

- Backend: Django 6, Django REST Framework (token authentication), django-cors-headers, bleach, django-background-tasks, SQLite
- Frontend: React 18, Vite 8, React Router 7, Axios, React Quill, DOMPurify, jsPDF with jspdf-autotable, date-fns, Lucide icons

## Project structure

```text
backend/
├── config/            # settings and root URLs
├── accounts/          # user model with roles; sign-in, registration and user API
└── news/              # stories, reviews, categories, deadlines, feed and reports API
    ├── management/commands/seed_data.py  # demo data
    ├── signals.py     # status updates and notification emails
    └── tasks.py       # deadline reminder task
frontend/
├── src/
│   ├── api/client.js  # API client
│   ├── pages/         # route components
│   └── components/    # shared UI
└── vite.config.js     # dev server port and /api proxy
docs/                  # workflow and API reference
```

## Docs

- [Editorial workflow](docs/workflow.md): roles, story statuses, pages and notifications
- [API reference](docs/api.md): authentication, endpoints, filters and story actions
