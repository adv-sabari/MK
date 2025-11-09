Magizh Krafties - Ordering App (Full-stack)
-------------------------------------------
Files included:
- server.js (Express + better-sqlite3)
- package.json
- public/index.html (customer order form)
- public/admin.html (admin panel)
- public/app.js (shared frontend helper)
- Dockerfile, docker-compose.yml
- db.sqlite will be created at runtime

Run locally:
1. npm install
2. export ADMIN_TOKEN=yourtoken   (optional, default: changeme123)
3. npm start
4. Open http://localhost:4000/ for order page and /admin.html for admin panel
