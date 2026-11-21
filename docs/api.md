# API reference

The backend serves a REST API under `/api/v1/`; locally that is `http://127.0.0.1:8000/api/v1/`. Request and response fields are defined by the serializers in `backend/accounts/serializers.py` and `backend/news/serializers.py`.

## Authentication

Exchange a username and password for a token:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "editor1", "password": "YOUR_PASSWORD"}'
```

The response holds `token` and `user` (`id`, `username`, `email`, `first_name`, `last_name`, `role`, `initials`, `is_active` and `date_joined`). Send the token to every endpoint that is not public:

```bash
curl http://127.0.0.1:8000/api/v1/news/stories/ \
  -H "Authorization: Token YOUR_TOKEN"
```

## Access and errors

In the **Access** columns below, **Public** needs no token, **Token** accepts any signed-in account, and **Admin** or **Editor, admin** needs a token for an account with that role.

| Status | Cause |
|---|---|
| `400` with `Invalid credentials.` | Wrong username or password, or a deactivated account, at `login/` |
| `401` | Missing or invalid token, or a deactivated account |
| `403` | Your role, or the story's current status, does not allow the request |
| `404` | The story does not exist or you cannot see it |

## Pagination

Paged lists return `count`, `next`, `previous` and `results`. Pass `page` to choose a page and, where the table allows, `page_size` to change its length.

| Endpoint | Page size | Largest `page_size` |
|---|---|---|
| `news/feed/` | 12 | 50 |
| `news/stories/` | 25 | 100 |
| `auth/users/` | 25 | Not adjustable |

`news/categories/`, `news/deadlines/`, `news/reports/` and a story's `history/` return unpaged results.

## Accounts

Paths are relative to `/api/v1/auth/`.

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `login/` | Public | Returns a token and the user |
| `POST` | `register/` | Public | Creates an account and returns `201` with a token and the user |
| `GET`, `PUT`, `PATCH` | `me/` | Token | Reads or updates your profile; send `current_password` with `new_password` to change your password |
| `GET`, `POST` | `users/` | Admin | Lists or creates accounts |
| `GET`, `PUT`, `PATCH`, `DELETE` | `users/{id}/` | Admin | Reads, updates or deletes an account |
| `POST` | `users/{id}/activate/` | Admin | Re-enables a deactivated account |
| `POST` | `users/{id}/deactivate/` | Admin | Blocks sign-in; the account's token stops working until it is activated again |

## News

Paths are relative to `/api/v1/news/`.

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `feed/` | Public | Published stories, newest first |
| `GET` | `feed/{slug}/` | Public | One published story |
| `GET` | `categories/` | Public | Active categories |
| `GET` | `deadlines/` | Token | Upcoming submission deadlines |
| `POST` | `deadlines/` | Admin | Creates a deadline |
| `GET` | `reports/` | Editor, admin | Stories published this calendar month, per journalist |
| `GET`, `POST` | `stories/` | Token | Lists the stories you can see, or creates a draft |
| `GET`, `PUT`, `PATCH`, `DELETE` | `stories/{id}/` | Token | Reads, edits or deletes a story |

Create and edit stories with `title`, `category_id`, `body` (HTML), `summary` (up to 300 characters), `is_breaking` and `tag_names` (a list of tag names). New stories start as `draft`.

### Filters

| Endpoint | Query parameters |
|---|---|
| `feed/` | `category` (category slug), `search` (case-insensitive match on title, summary or body), `date_from` and `date_to` (publication date, `YYYY-MM-DD`) |
| `stories/` | `status`, `category` (category ID), `journalist` (user ID), `tag` (tag name), `date` (creation date, `YYYY-MM-DD`), `sort` (`updated_at`, `submitted_at` or `title`, with a leading `-` for descending; default `-updated_at`) |
| `reports/` | `journalist` (username), `tag` (tag name), `is_breaking` (any non-empty value), `category_id` |

`reports/` returns `journalist_data` (every journalist, with their stories published this month), `total_count` and `period` (month and year). The filters change only `total_count`.

### Who sees which stories

Journalists see only their own stories, editors see every story except drafts, and admins see every story. Journalists can edit their own stories while they are drafts or have changes requested, and delete them while they are drafts or archived. Editors and admins can edit or delete any story they can see.

### Story actions

Paths are relative to `/api/v1/news/stories/{id}/`. An action on a story in the wrong status returns `400` with a `detail` message.

| Method | Path | Effect |
|---|---|---|
| `POST` | `submit/` | `draft` or `changes_requested` → `submitted` |
| `POST` | `start_review/` | `submitted` → `under_review` |
| `POST` | `stop_review/` | `under_review` → `submitted` |
| `POST` | `review/` | Records a review decision (see below) |
| `POST` | `publish/` | `approved` → `published` |
| `POST` | `unpublish/` | `published` → `changes_requested` |
| `POST` | `archive/` | Any status → `archived` |
| `GET` | `history/` | The story's review records, newest first |

For `review/`, send `action` and `comment`. The web app sends `approved`, `changes_requested` or `rejected`, and the story's status becomes that value; `changes_requested` and `rejected` need a comment. The story must be `submitted`, `under_review` or `approved`, and a `submitted` story moves to `under_review` first. `publish/`, `unpublish/` and `archive/` take an optional `comment`, which is stored in the story's history.

Role checks for each action are implemented in `NewsStoryViewSet` in `backend/news/views.py`.
