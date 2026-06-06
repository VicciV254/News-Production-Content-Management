# Broadcast Media — News Production & Content Management

Editorial CMS for broadcast media institutions. Replaces WhatsApp-based script sharing with a full workflow: **write → submit → edit review → approve → publish → archive**.

## Tech Stack

- **Backend:** Django 6.0, Django REST Framework, SQLite, bleach (HTML sanitization), django-background-tasks
- **Frontend:** React 18, Vite, React Router, React Quill, jsPDF, jspdf-autotable, Lucide Icons, DOMPurify

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

| Page | Route | Role | Description |
|------|-------|------|-------------|
| Landing Page | `/` | Everyone | Public news feed with story cards, search, category filters, and date range filters |
| Story Detail | `/feed/:slug` | Everyone | Full story view with back to feed option |
| My Stories | `/stories` | Journalist | View all stories with status tabs (draft, submitted, under review, changes requested, approved, published, rejected, archived), delete drafts/archived stories |
| Story Editor | `/stories/:id/edit` | Journalist | Create/edit stories with rich text editor, tags, category, breaking news toggle, auto-save |
| Editorial Review | `/review` | Editor/Admin | Review submitted stories with status tabs (all, submitted, under review, approved, changes requested, rejected, published), approve/request changes/reject/publish/unpublish/delete |
| Analytics | `/analytics` | Editor/Admin | Table-based analytics showing journalist stories with category and tags, filtering by journalist/category/tag, PDF report downloads |
| Admin Dashboard | `/admin` | Admin | Manage users (view by role, add/remove accounts, manage permissions) |
| User Profile | `/profile` | Authenticated | Update user details and change password |
| Login | `/login` | Everyone | Login with option to create new account with role selection |

## Workflow

1. **Journalist** creates a draft in the Story Editor (rich text, tags, category, breaking toggle, auto-save every 60s)
2. **Submit for Review** → status becomes `submitted`, confirmation email sent
3. **Editor** reviews in Editorial Review:
   - Put story under review (moves to "under review" tab)
   - From under review: Approve, Request Changes (with comment), or Reject
   - Stop reviewing option available (unless approved/rejected)
4. **Approved** stories can be **Published** to the public feed by editors or by the journalist who owns the story
5. Published stories can be **Unpublished** (moves back to review with feedback) or **Deleted**
6. Stories can be **Archived** for long-term storage
7. Journalists can delete their own **drafts** and **archived** stories

## Key Features

### Editorial Review System
- **Multi-tab filtering**: All, Submitted, Under Review, Approved, Changes Requested, Rejected, Published
- **Notification badges**: Dynamic unread counts per status tab, visible across all tabs
- **Story workflow**: Submit → Under Review → Approve/Request Changes/Reject → Publish
- **Unpublish with feedback**: Editors can unpublish published stories with feedback, moving them back to review
- **Delete published stories**: Editors can delete published stories from the Published tab

### Journalist Features
- **My Stories dashboard**: View all stories organized by status tabs
- **Delete drafts/archived**: Journalists can delete their own drafts and archived stories
- **Publish approved stories**: Journalists can publish their own approved stories
- **Notification system**: High opacity for unread stories in each status tab, updates when story status changes

### Analytics Dashboard
- **Table-based view**: Replaced visual graphs with interactive tables
- **Journalist filtering**: View stories by individual journalist with detailed breakdown
- **Category and tag filtering**: Filter analytics by category or tag
- **PDF reports**: Download PDF reports for individual journalists or all journalists at once
- **Dynamic data**: Shows all journalists even if they have zero published stories

### News Feed
- **Public access**: Anyone can view published stories without login
- **Search functionality**: Search stories by title/content
- **Category filtering**: Filter stories by category
- **Date range filtering**: From and to date filters (default: from 01/06/2026 to current date)
- **Responsive design**: Mobile-friendly story cards

### User Management
- **Role-based access**: Journalist, Editor, Admin roles with different permissions
- **Account creation**: New users can register with role selection (journalist/editor)
- **Profile management**: Users can update their details and change passwords
- **Admin dashboard**: Admins can view all users by role, add/remove accounts, manage permissions

### Story Editor
- **Rich text editing**: React Quill editor with formatting options
- **Auto-save**: Automatic draft saving every 60 seconds
- **Tags and categories**: Assign multiple tags and a category to each story
- **Breaking news toggle**: Mark stories as breaking news
- **Story history**: View edit history for stories

## Notification System

### Editorial Review Notifications
- **Badge counts**: Each status tab shows number of unread stories
- **Cross-tab visibility**: Notification badges visible even when not in the specific tab
- **Dynamic updates**: Counts update when stories are viewed
- **Status change alerts**: Stories regain high opacity when moving to a new status tab, even if previously viewed

### Journalist Notifications
- **Status updates**: Journalists see notification badges in My Stories for each status tab
- **Unread indicators**: High opacity for unread stories in each tab
- **Real-time updates**: Notifications update as stories move through the workflow

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
