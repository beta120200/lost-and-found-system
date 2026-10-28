# Lost and Found System

A working implementation of the system design document: a multi-page
HTML5/CSS3/vanilla JavaScript frontend talking to a PHP REST API, backed
by MySQL, with Workerman-powered live updates — built to run locally
under XAMPP.

## 1. Setup (XAMPP)

1. Copy this whole `lost-and-found-system` folder into your XAMPP
   `htdocs` directory, e.g. `C:\xampp\htdocs\lost-and-found-system`.
2. Open the XAMPP Control Panel and start **Apache** and **MySQL**.
3. Open `http://localhost/phpmyadmin`, click **Import**, choose
   `database/schema.sql`, and run it. This creates the `lost_and_found`
   database and its four tables.
4. Copy `.env.example` to `.env` in the project root. The defaults
   already match a fresh XAMPP install, so for a basic run you don't
   need to change anything — but this is where you'd put a real MySQL
   password or an ImgBB key (see §3 below).
5. Install Composer dependencies (just Workerman, for live updates):
   open a terminal in the project folder and run:
   ```
   composer install
   ```
   (Get Composer from <https://getcomposer.org/> if you don't have it.)
6. Open `http://localhost/lost-and-found-system/api/seed.php` once in
   your browser. This loads three demo accounts and a batch of demo
   posts (some recent, some 30+ days old so the "Still Not Found"
   sidebar isn't empty). Safe to run more than once — it just tells you
   it already seeded and changes nothing.
7. **Start the realtime server** for live updates (optional but
   recommended — the app works fine without it, posts just won't
   appear for other people until they refresh). In a terminal:
   ```
   cd lost-and-found-system
   php realtime/server.php start
   ```
   Leave this running in its own terminal window alongside Apache/MySQL.
8. Open `http://localhost/lost-and-found-system/` — you're in.

**Demo accounts** (also shown on the login page):

| Role  | Email                | Password      |
|-------|-----------------------|---------------|
| User  | maria@icct.edu.ph     | password123   |
| User  | jake@icct.edu.ph      | password123   |
| Admin | admin@icct.edu.ph     | admin123      |

## 2. Pages

Matches Section 6 (Main Application Pages) of the doc exactly — all
seven listed pages are real, separate `.html` files, not one single-page
app, so the browser's back button, bookmarks, and shareable links all
just work:

| Page | File | Notes |
|------|------|-------|
| Login | `login.html` | |
| Signup | `signup.html` | |
| User Feed | `feed.html` | Composer, filters/search, infinite-scroll feed, "Still Not Found" sidebar |
| Create Post | `create-post.html` | Also handles editing, via `?edit=<id>` — see below |
| Post Details | `post-details.html` | Reached via `?id=<post id>` from the feed, My Posts, or the admin table |
| My Posts | `my-posts.html` | |
| Admin Dashboard | `admin.html` | |
| *(entry point)* | `index.html` | Checks your session and redirects you to the right page above |

**One deliberate choice:** `create-post.html` handles both creating and
editing a post (`?edit=<id>` pre-fills the form and PUTs instead of
POSTing) rather than being a second near-identical page — the doc only
lists "Create Post" once, and the field set is identical either way.

Report, resolve, and delete stayed as small confirmation modals
(`assets/js/modals.js`) rather than becoming pages of their own — Section
6 doesn't list them as pages, and a full navigation for a two-button
yes/no confirmation would be overkill.

Every protected page checks its session with the API on load
(`requireSession()` in `assets/js/common.js`) and redirects if you're
logged out or logged in as the wrong role — verified with a real headless
browser for all three cases (admin → feed, user → admin, logged-out →
login), and the full create → view → edit → delete flow was walked
through end-to-end the same way, including an admin viewing someone
else's post and seeing a "Remove Post" action instead of Edit.

## 3. Optional: real photo uploads via ImgBB

Per Section 7.2, post photos are meant to be hosted on ImgBB rather than
the app server. This works out of the box with **no key configured** —
the app falls back to the emoji icon the user picks in the form. To turn
on real uploads, create a free account at <https://api.imgbb.com/>,
copy your API key, and put it in `.env`:
```
IMGBB_API_KEY=your-key-here
```

**Troubleshooting photo uploads (Windows / XAMPP):** if creating a post
with a photo shows "Photo upload failed", the message says why. The usual
causes:
- *SSL certificate problem* — download <https://curl.se/ca/cacert.pem>,
  save it as `api/config/cacert.pem` (or point `curl.cainfo` and
  `openssl.cafile` in `php.ini` at it), then restart Apache.
- *Photo too large* — raise `upload_max_filesize` and `post_max_size` in
  `php.ini` (XAMPP defaults to 2M / 8M), then restart Apache.
- *Key problems* — check `.env` (not `.env.example`) holds a valid
  `IMGBB_API_KEY`, with no extra spaces.

## 4. Live updates

Posts, reports, and user status changes now broadcast live to every open
browser tab via a small WebSocket server (`realtime/server.php`, built on
[Workerman](https://www.workerman.net/)) — verified end-to-end with two
separate real browser sessions: one creates a post, the other sees it
appear with no reload.

**Why Workerman:** it's pure PHP with zero required dependencies (checked
its own `composer.json` directly), and it runs fine on Windows — unlike
Swoole, which needs a compiled extension XAMPP doesn't ship.

**How it works, without changing the existing REST API's shape:**
- `realtime/server.php` is a single WebSocket server process you run
  alongside Apache/MySQL (see setup step 7). It's deliberately *one*
  process — an earlier version tried a second internal HTTP listener in
  the same script for the API to call, but Workerman forks a separate OS
  process per listener, so that second listener didn't actually share
  memory with the first; broadcasts silently went nowhere. Caught via
  real testing, not just reading the docs, and fixed by collapsing to one.
- Each controller method that changes something calls `notify_realtime()`
  (`api/helpers/realtime.php`) — one line, right after the database write.
  That function connects to the realtime server as a plain WebSocket
  client (hand-rolled handshake + frame, no Composer dependency needed
  on this side either) and publishes a small JSON event, authenticated
  with a shared secret (`REALTIME_PUBLISH_SECRET` in `.env`) so random
  connections to the port can't spoof events.
- `assets/js/realtime.js` connects every browser tab to that same port
  and calls `window.onRealtimeEvent(event, data)`, which `feed.js` and
  `admin.js` each define with whatever refresh makes sense for that page.
- If the realtime server isn't running, `notify_realtime()` fails
  silently and the REST API works exactly as before — live updates are
  an enhancement, never a dependency of the core app.

## 5. Project structure

```
lost-and-found-system/
├── index.html, login.html, signup.html, feed.html,
│   create-post.html, post-details.html,
│   my-posts.html, admin.html               The eight pages (see §2)
├── .env.example                            Copy to .env and fill in
├── composer.json                           Just workerman/workerman
├── assets/
│   ├── css/app.css                         All styling (shared)
│   └── js/
│       ├── api.js            Fetch wrapper + every API call
│       ├── common.js         Shared helpers, header, modal plumbing, session guards
│       ├── modals.js         Report / resolve-confirm / delete-confirm modals
│       ├── realtime.js       WebSocket client (feed.html, admin.html only)
│       └── login.js, signup.js, feed.js, create-post.js,
│           post-details.js, my-posts.js, admin.js
│                              One small bootstrap file per page
├── database/
│   └── schema.sql            users / posts / reports / resolved_log tables
├── realtime/
│   └── server.php            Workerman live-update server (run separately)
└── api/
    ├── index.php              Front controller — routes every /api/* request
    ├── .htaccess               Rewrites /api/* through index.php (Apache)
    ├── seed.php                 One-time demo data loader (run in browser)
    ├── config/
    │   ├── db.php              MySQL connection, reads .env
    │   └── imgbb.php           ImgBB key + expiration, reads .env
    ├── helpers/
    │   ├── env.php             Minimal .env parser (no Composer dependency)
    │   ├── response.php        JSON response + request-body helpers
    │   ├── auth.php            Session login/logout, require_auth(), require_admin()
    │   ├── imgbb.php           Uploads a photo to ImgBB, returns the URL
    │   └── realtime.php        Publishes an event to the realtime server
    └── controllers/
        ├── auth_controller.php    signup / login / logout / me
        ├── posts_controller.php   feed, CRUD, report, resolve
        └── admin_controller.php   dashboard, users, posts, reports
```

## 6. API routes

Matches Section 14 of the design doc, plus a few additions noted below
(needed to implement things the doc describes elsewhere — like the
Reports panel in Section 12.1 — but didn't list as endpoints).

| Method | Route                          | Notes |
|--------|----------------------------------|-------|
| POST   | `/api/auth/signup`              | |
| POST   | `/api/auth/login`                | |
| POST   | `/api/auth/logout`               | |
| GET    | `/api/auth/me`                   | *Addition* — restores a session on page load |
| GET    | `/api/posts`                     | `?type=lost\|found`, `?search=`, `?offset=&limit=` |
| GET    | `/api/posts?stale=1&limit=20`    | *Addition* — "Still Not Found" sidebar (30+ days pending) |
| GET    | `/api/posts?mine=1`              | *Addition* — "My Posts" (requires login) |
| GET    | `/api/posts/:id`                 | |
| POST   | `/api/posts`                     | multipart/form-data; optional `image` file |
| PUT    | `/api/posts/:id`                 | owner or admin only |
| DELETE | `/api/posts/:id`                 | owner or admin only |
| POST   | `/api/posts/:id/report`          | |
| PATCH  | `/api/posts/:id/resolve`         | body `{"confirmed": true}` — deletes the post per Section 13 |
| GET    | `/api/admin/dashboard`           | admin only |
| GET    | `/api/admin/users`                | admin only |
| PATCH  | `/api/admin/users/:id`           | *Addition* — toggles active/disabled |
| GET    | `/api/admin/posts`                | admin only |
| GET    | `/api/admin/reports`              | *Addition* — admin only |
| PATCH  | `/api/admin/reports/:id/dismiss`      | *Addition* |
| PATCH  | `/api/admin/reports/:id/remove-post`  | *Addition* |

All role checks happen server-side (`require_auth()` / `require_admin()`
in `api/helpers/auth.php`) — a page redirect is UX, not the actual
security boundary, per Section 5.

## 7. Design notes / deviations from the doc

- **`resolved_log` table**: not in the original schema. Section 8.2 says
  resolved posts are deleted outright, but Section 12.1's dashboard still
  needs a "Resolved Items" count. This table is a tiny, anonymous log
  (item name, type, timestamp) written at the same moment a post is
  deleted via the resolve flow — not a copy of the post.
- **Photo uploads are create-only.** Editing a post updates text fields
  only; replacing a photo isn't implemented (a reasonable scope cut for
  a capstone-style project — documented here rather than silently
  missing).
- **Report / resolve / delete are modals, not pages** — see §2.

This project was built and tested end-to-end against a real MySQL
instance and a real headless browser before being handed off: login,
signup, ownership checks, image upload with graceful fallback, the
role-based page redirects, and the full click-by-click user journey —
composer → create-post.html (with the Lost/Found type correctly
pre-selected) → redirected to the feed → click the new card →
post-details.html → Edit → create-post.html?edit=id (pre-filled from
the real database) → save → redirected to My Posts showing the change
→ delete from the details page → redirected away, and the post
confirmed gone on revisit. Also confirmed an admin viewing someone
else's post gets a "Remove Post" action instead of Edit. And, using two
independent browser sessions, a post created in one tab appearing live
in another via the realtime server, with no page reload.
