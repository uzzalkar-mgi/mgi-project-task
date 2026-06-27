# MGI Project Tracking System (PTS)

A centralized web application to plan, assign, and monitor projects and tasks in real time —
project timelines, task assignment, status workflows, and dashboards, without enterprise bloat.

Inspired by ClickUp; built for MGI teams.

---

## Tech Stack

| Layer        | Technology |
|--------------|------------|
| Backend      | Laravel 13 (PHP 8.3) |
| Frontend     | React 19 (JSX) via **Inertia.js** — no separate SPA/API |
| Styling      | Tailwind CSS 3 (MGI Connect design system) |
| Auth         | Laravel Breeze (session-based, Inertia/React) |
| Database     | PostgreSQL |
| Build        | Vite 8 |

React lives inside Laravel under `resources/js/`; controllers return `Inertia::render()`.
No Node.js runtime in production — Vite compiles assets to `public/build/`.

---

## Features

- **RBAC** — multiple roles per user; dynamic roles with a module × action permission matrix
  (menu / view / create / update / delete / assign / manage). Super-admin bypass via `Gate::before`.
- **Projects** — CRUD, accountability chain (lead, primary & secondary responsible), members,
  tags (free-text, auto-created), priority/status, progress, soft-delete.
- **Tasks** — assignees (many), reporter, sub-tasks, dependencies, priorities, estimated hours,
  **Kanban board with drag-and-drop status** (assignee-only) + file attachments.
- **Dashboard** — active projects, my tasks, overdue, completed; project health (RAG); my-tasks list.
- **Timeline** — lightweight Gantt (task bars by start→due, month axis, today line).
- **Milestones** — per-project key dates.
- **Team / Users** — admin user management, multi-role assign, department & designation,
  avatar upload, status toggle, search + pagination, user detail (projects + assigned tasks).
- **Settings** — Roles, Departments, Designations management.
- **Cross-cutting** — activity logs, in-app notifications, soft-deletes (90-day window).

---

## Roles (default)

| Role    | Access |
|---------|--------|
| Admin   | Super-admin — full access incl. users, roles, departments, designations |
| Manager | Projects, tasks, timeline, milestones, dashboard (no user/role admin) |
| Member  | View projects; create/update/view own tasks; personal dashboard |

---

## Getting Started

### Requirements
- PHP 8.3+, Composer
- Node.js 20+ / npm
- PostgreSQL

### Setup

```bash
# 1. Install dependencies
composer install
npm install

# 2. Environment
cp .env.example .env
php artisan key:generate
# Edit .env — set DB_CONNECTION=pgsql, DB_DATABASE, DB_USERNAME, DB_PASSWORD

# 3. Database
php artisan migrate --seed
php artisan storage:link

# 4. Run (two terminals, dev)
php artisan serve
npm run dev
```

Production build: `npm run build`.

### Seeded Logins (password: `password`)

| Email            | Role    |
|------------------|---------|
| admin@mgi.org    | Admin   |
| manager@mgi.org  | Manager |
| member@mgi.org   | Member  |

Plus 10 sample employees (`MGI-1001`…`MGI-1010`) and 2 seeded projects with tasks & milestones.

---

## Project Structure

```
app/
  Http/Controllers/   # Inertia controllers (Project, Task, User, Role, ...)
  Models/             # Eloquent models (Project, Task, User, Role, Permission, ...)
database/
  migrations/         # schema
  seeders/            # RolePermission, Employee, DepartmentDesignation, ProjectTask
resources/
  js/
    Pages/            # one .jsx per Inertia page
    Components/ui/    # design-system primitives (Card, Badge, Combobox, ...)
    Layouts/          # AuthenticatedLayout (sidebar + topbar)
  css/app.css         # Tailwind entry
routes/web.php        # all routes
```

---

## Conventions

- Browser-facing IDs use a unique **`uuid`** column (bigint `id` stays primary key);
  route-model binding by uuid.
- Permissions checked server-side (`Gate` / `$user->hasPermission()`) **and** in the UI
  (`usePermissions()` hook).
- Status columns follow the `HasStatus` trait (1 = Active, 0 = Inactive).

---

_Built on the [Laravel](https://laravel.com) framework (MIT)._
