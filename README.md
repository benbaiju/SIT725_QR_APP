# SIT725 QR App

QR-based restaurant menu web application for SIT725.

## Docker Deployment

This repository is containerised with Docker Compose. The full application runs end-to-end: **frontend (Nginx)**, **backend (Node/Express)**, and **MongoDB**.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Docker Compose v2)
- Node.js 18+ (only needed to run the helper script `docker-env.js` before Compose starts)
- Git (to clone this repository)

### Get the project

Clone the repository and open the project folder:

```bash
git clone <https://github.com/benbaiju/SIT725_QR_APP.git>
cd SIT725_QR_APP
```

All commands below are run from the **repository root**.

### Configuration

Sensitive values are **not** committed. Use `.env` at the project root (gitignored).

1. Copy the example file (if `.env` does not exist yet):

```bash
cp .env.example .env
```

2. Edit `.env` and set `JWT_SECRET` to any non-empty secret string (required for login). Other defaults in `.env.example` work for Docker Compose:

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | MongoDB inside Compose (`mongodb://mongodb:27017/sit725_qr_app`) |
| `JWT_SECRET` | Signs login tokens — **you must set this** |
| `BASE_URL` | Host used when generating table QR codes (see below) |

`docker-env.js` behaves in two steps:

1. **If `.env` does not exist** — it copies `.env.example` to `.env`, so all required variables (`NODE_ENV`, `MONGO_URI`, `JWT_SECRET`, `BASE_URL`) are present.
2. **If `.env` already exists** — it updates **only** the `BASE_URL` line and leaves `JWT_SECRET`, `MONGO_URI`, and `NODE_ENV` unchanged.

You should still set `JWT_SECRET` in `.env` before logging in (the value from `.env.example` is a placeholder until you replace it).

- Default `BASE_URL`: `http://localhost:8080` (browser on the same machine)
- With `--local-ip`: your LAN IP, e.g. `http://192.168.0.79:8080` (QR scanning from a phone on the same Wi‑Fi)

**Using localhost only:** If you plan to run and test the application on the same computer, please use the default commands below (`docker:start` or `docker:start:seed`). The `:local-ip` scripts are not required in that case.

**Using your LAN IP (optional):** Please use `docker:start:local-ip` or `docker:start:seed:local-ip` only if you would like to scan table QR codes from a phone on the same Wi‑Fi network. After switching to a local IP, run `docker compose exec backend npm run seed:admin` again so QR codes are regenerated with the updated `BASE_URL`.

### Build and start

```bash
npm run docker:start:seed
```

This will:

1. Ensure `.env` exists (from `.env.example` if needed) and set `BASE_URL` to localhost
2. Build and start all containers
3. Seed the database (admin, demo owner, restaurant, table QR codes)

Wait until all three containers are healthy (`docker compose ps`).

### Alternative commands

| Command | Use when |
|---------|----------|
| `npm run docker:start` | Start without seeding |
| `npm run docker:start:seed` | Start and seed the database (suggested for first run) |
| `npm run docker:start:local-ip` | Start with LAN IP in `BASE_URL` |
| `npm run docker:start:seed:local-ip` | Start + seed + LAN IP for phone QR testing |

Manual seed after containers are up:

```bash
docker compose exec backend npm run seed:admin
```

Stop the stack:

```bash
docker compose down
```

Remove containers, local images, and database volume (clean reset):

```bash
docker compose down --volumes --rmi local
```

### Access the application

| Service | URL |
|---------|-----|
| **Frontend (main UI)** | http://localhost:8080/pages/login.html |
| Backend API (direct) | http://localhost:5001/api |
| MongoDB (host) | localhost:27017 |

The frontend Nginx container proxies `/api/*` to the backend, so the browser can use `http://localhost:8080` for both pages and API calls.

### `/api/student` endpoint

With Docker running, you can verify the endpoint with:

```bash
curl http://localhost:8080/api/student
```

Expected JSON:

```json
{
  "fullName": "Ben Baiju",
  "studentId": "S225709846"
}
```

Same response via backend port: `http://localhost:5001/api/student`

### Seeded login accounts (after `seed:admin`)

| Role | Email | Password |
|------|-------|----------|
| Super admin | `admin@system.com` | `admin123` |
| Demo owner | `owner@example.com` | `owner123` |

These accounts can be used to verify **database-backed login** (for example, open the login page, sign in as the demo owner, and view the owner dashboard and table QR codes).

### Docker layout

| Path | Role |
|------|------|
| `docker-compose.yml` | Orchestrates mongodb, backend, frontend |
| `backend/Dockerfile` | Multi-stage Node backend image |
| `frontend/Dockerfile` | Nginx serves static frontend |
| `frontend/nginx.conf` | Routes `/`, `/menu/`, `/api/`, and `/socket.io/` |
| `docker-env.js` | Creates/updates `BASE_URL` in `.env` |
| `.env.example` | Template for required environment variables |

### Troubleshooting

- **Login fails with internal error** — Check `JWT_SECRET` is set in `.env`, then restart: `docker compose up -d --force-recreate backend`
- **QR link fails on phone** — Use `npm run docker:start:seed:local-ip`, re-run seed, ensure phone is on the same Wi‑Fi as the host
- **Port 8080 in use** — Stop other services on 8080 or change the frontend port mapping in `docker-compose.yml`

---

## Current Project Status

The backend currently supports:
- Auth for owner registration, login, profile updates, and password changes with JWT issuance
- Super admin workflows for owner approval/rejection/disable/enable, restaurant listing, and table QR generation
- Owner restaurant profile management
- Owner menu CRUD, availability toggling, and owner table listing
- MongoDB-backed menu image uploads using GridFS
- Public guest menu endpoint for scanned QR links
- Table sessions for dine-in QR ordering
- Guest cart APIs with unavailable/removed item handling
- Order placement and order lookup
- Owner analytics summary, peak-hours, and item-forecast endpoints
- Real-time menu refresh events with Socket.IO

## Tech Stack

- Frontend: HTML, CSS, Materialize CSS, vanilla JavaScript
- Backend: Node.js + Express.js
- Database: MongoDB + Mongoose
- Auth: JWT (`jsonwebtoken`)
- Realtime: Socket.IO
- Uploads: Multer + MongoDB GridFS

## Architecture

- Backend uses MVC (`models`, `controllers`, `routes`, `middleware`, `utils`, `config`)
- Frontend is static pages consuming backend REST APIs via `fetch()`
- Socket.IO is attached to the Express HTTP server for restaurant-specific menu update events
- Menu images are stored in MongoDB GridFS and exposed through public image streaming URLs

## Repository Structure

- `backend/`: API server and database layer
- `frontend/`: static pages and UI components
- `docker-compose.yml`, `docker-env.js`, `.env.example`: Docker deployment
- `docs/`: SRS and team documentation

## Local Setup (without Docker)

For development without containers, use a local MongoDB instance and environment variables under `backend/`. **To run the containerised version of this application, please follow the Docker section above.**

1. Clone and open project:
```bash
git clone <repo-url>
cd SIT725_QR_APP
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Fill required values in `backend/.env`:
- `PORT` (example: `5001`)
- `MONGO_URI` (example: `mongodb://127.0.0.1:27017/sit725_qr_app`)
- `JWT_SECRET` (long random string)
- `JWT_EXPIRES_IN` (example: `7d`)
- `BASE_URL` (used by QR generation, example: `http://localhost:5001`)

5. Seed initial data (recommended for first run):
```bash
npm run seed:admin
```

6. Start backend:
```bash
npm run dev
```

7. Open the app through the backend server:
- `http://localhost:5001/`
- Guest menu example: `http://localhost:5001/menu/<restaurantId>?table=1`

## NPM Scripts

From `backend/`:
- `npm run dev`: start API in watch mode
- `npm start`: start API with Node
- `npm run seed:admin`: create admin, owner, restaurant, and tables with QR codes
- `npm run seed:e2e`: seed richer E2E dataset

## Authentication Flow (JWT)

1. Client calls `POST /api/auth/login` with email/password.
2. Backend verifies credentials and owner approval status.
3. Backend returns `token` + `user`.
4. Client sends token in header for protected APIs:
   - `Authorization: Bearer <jwt>`
5. `protect` middleware verifies token using `JWT_SECRET`.
6. `authorize(...)` middleware enforces role access (`owner`, `super_admin`).

### Notes
- Owners with status other than `approved` cannot log in.
- Missing/invalid token returns `401 Not authorized`.
- Wrong role returns `403 Forbidden`.

## API Base URL

Local default:
- `http://localhost:5001/api`

## API Endpoints (Currently Wired in `server.js`)

### Auth APIs (`/api/auth`)

- `POST /register`
  - Purpose: owner self-registration (creates pending owner account)
  - Auth required: no

- `POST /login`
  - Purpose: login for admin/owner
  - Auth required: no
  - Returns JWT token

- `GET /me`
  - Purpose: fetch current authenticated user profile
  - Auth required: yes

- `PUT /me`
  - Purpose: update current authenticated user profile
  - Auth required: yes

- `PUT /me/password`
  - Purpose: update current authenticated user password
  - Auth required: yes

### Menu APIs (`/api/menu`)

Guest/public:
- `GET /public/:restaurantId`
  - Purpose: public QR menu, returns available items only
- `GET /images/:imageFileId`
  - Purpose: stream a menu image stored in MongoDB GridFS

Owner-only:
- `GET /my`
- `GET /my/tables`
- `POST /my/images`
  - Purpose: upload an image file for a menu item
  - Body: `multipart/form-data` with field `image`
  - Limits: image files only, max 5MB
- `POST /my`
- `PUT /my/:itemId`
- `DELETE /my/:itemId`
- `PATCH /my/:itemId/availability`

Super-admin-only:
- `GET /:restaurantId` (view any restaurant menu)

Allowed menu categories:
- `Appetizers`
- `Mains`
- `Desserts`
- `Sides`
- `Beverages`

Backend category aliases:
- `Starter` -> `Appetizers`
- `Starters` -> `Appetizers`

### Admin APIs (`/api/admin`)

All routes require `super_admin` token:
- `GET /owners/pending`
- `GET /owners`
- `PATCH /owners/:id/approve`
- `PATCH /owners/:id/reject`
- `PATCH /owners/:id/disable`
- `PATCH /owners/:id/enable`
- `GET /restaurants`
- `POST /restaurants/:id/tables` (regenerates tables + QRs)
- `GET /restaurants/:id/tables`

### Restaurant APIs (`/api/restaurants`)

Owner-only:
- `GET /my`
- `PUT /my`

### Session APIs (`/api/sessions`)

Guest/public:
- `POST /start`
- `GET /active`
- `GET /:sessionId`

Owner-only:
- `PATCH /:sessionId/close`

### Cart APIs (`/api/cart`)

Guest/public:
- `GET /:sessionId`
- `POST /:sessionId/items`
- `PUT /:sessionId/items/:menuItemId`
- `DELETE /:sessionId/items/:menuItemId`
- `DELETE /:sessionId`

Cart responses include live item availability:
- `availabilityStatus: "available"`
- `availabilityStatus: "unavailable"`
- `availabilityStatus: "removed"`

### Order APIs (`/api/orders`)

Guest/public:
- `POST /`
- `GET /:orderId`

Order placement validates that:
- the table session exists and is active
- the cart is not empty
- all cart items still exist and are available

### Analytics APIs (`/api/analytics`)

Owner-only:
- `GET /my/summary`
- `GET /my/peak-hours`
- `GET /my/item-forecast`

### Realtime Events

Socket.IO is configured on the backend server.

- Client menu pages emit `joinRestaurantMenu` with a `restaurantId`.
- The backend emits `menuUpdated` to `restaurant:<restaurantId>` after successful owner menu create/update/delete/availability changes.
- Client pages refresh the public menu and cart when `menuUpdated` is received.

## Example Usage Scenarios

### Scenario 1: Owner registration and approval

1. Owner submits registration:
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "owner123",
  "pendingRestaurantName": "Alice Cafe",
  "pendingRestaurantAddress": "10 Main St",
  "pendingRestaurantPhone": "0400000000",
  "pendingRestaurantEmail": "contact@alicecafe.com"
}
```

2. Super admin logs in and approves owner:
```http
PATCH /api/admin/owners/<ownerId>/approve
Authorization: Bearer <super_admin_jwt>
```

### Scenario 2: Owner menu management (implemented)

1. Owner login:
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "owner@example.com",
  "password": "owner123"
}
```

2. Create menu item:
```http
POST /api/menu/my
Authorization: Bearer <owner_jwt>
Content-Type: application/json

{
  "name": "Margherita Pizza",
  "category": "Mains",
  "description": "Tomato, mozzarella, basil",
  "price": 16.5,
  "isAvailable": true
}
```

Optional image upload before creating/updating the item:
```http
POST /api/menu/my/images
Authorization: Bearer <owner_jwt>
Content-Type: multipart/form-data

image=<file>
```

Response:
```json
{
  "success": true,
  "imageFileId": "<gridfs_file_id>",
  "imageUrl": "/api/menu/images/<gridfs_file_id>"
}
```

Save the returned `imageUrl` and `imageFileId` on the menu item:
```json
{
  "name": "Margherita Pizza",
  "category": "Mains",
  "description": "Tomato, mozzarella, basil",
  "price": 16.5,
  "image": "/api/menu/images/<gridfs_file_id>",
  "imageFileId": "<gridfs_file_id>",
  "isAvailable": true
}
```

3. Toggle availability:
```http
PATCH /api/menu/my/<itemId>/availability
Authorization: Bearer <owner_jwt>
Content-Type: application/json

{
  "isAvailable": false
}
```

4. Fetch own menu:
```http
GET /api/menu/my
Authorization: Bearer <owner_jwt>
```

### Scenario 3: Table and QR generation (implemented)

Super admin sets 10 tables for a restaurant:
```http
POST /api/admin/restaurants/<restaurantId>/tables
Authorization: Bearer <super_admin_jwt>
Content-Type: application/json

{
  "totalTables": 10
}
```

Result:
- Existing tables for that restaurant are replaced
- New QR links are generated using `BASE_URL/menu/<restaurantId>?table=<tableNumber>`
- `restaurant.totalTables` is updated

### Scenario 4: Guest QR menu, cart, and order

1. Customer opens a table-specific QR menu:
```text
http://localhost:5001/menu/<restaurantId>?table=1
```

2. Frontend starts or resumes a table session:
```http
POST /api/sessions/start
Content-Type: application/json

{
  "restaurantId": "<restaurantId>",
  "tableNumber": 1
}
```

3. Add an item to cart:
```http
POST /api/cart/<sessionId>/items
Content-Type: application/json

{
  "menuItemId": "<menuItemId>",
  "quantity": 1
}
```

4. Place order:
```http
POST /api/orders
Content-Type: application/json

{
  "sessionId": "<sessionId>"
}
```

If an owner marks an item unavailable or deletes it while it is already in a cart, the cart response marks it as `unavailable` or `removed`, and order placement is blocked until the item is removed.

## Postman and Testing

- A collection exists at `backend/postman/SIT725_QR_App.postman_collection.json`
- Use seeded users for quick testing:
  - Admin: `admin@system.com` / `admin123`
  - Owner: `owner@example.com` / `owner123`

From the repository root:
```bash
npm test
npm run test:integration
npm run test:all
npm run test:e2e
npm run test:validation
```

## Team Role Handoff

Backend developer:
- Implement MongoDB schemas in `backend/models/`
- Add business logic in `backend/controllers/`
- Wire endpoints in `backend/routes/`
- Keep auth-protected routes behind `backend/middleware/authMiddleware.js`
- Keep owner-scoped writes constrained to the authenticated owner's `restaurantId`
- Keep uploaded menu images validated and stored through GridFS

Frontend developer:
- Build UI in `frontend/pages/` + `frontend/components/`
- Add shared styles/scripts in `frontend/assets/`
- Connect to backend via REST APIs using `fetch()`
- Use Socket.IO `menuUpdated` events to refresh client-facing menus in real time

QA developer:
- Validate auth and role protection (`401`/`403` behavior)
- Validate owner menu CRUD, image upload, realtime menu refresh, cart availability handling, and admin table/QR generation
- Track test cases in `docs/diagrams/` or QA docs
- Verify regression after merged features

## Important Rules

- Do not commit real `.env` values
- Do not use frontend frameworks for this project
- Keep backend modular and MVC-aligned
- QR links should map to menu by restaurant id
- Customer cart URLs should include `?table=<number>` so a table session can be created
- Menu image uploads should remain owner-only and image files only
- Restrict Socket.IO CORS before production deployment

## New Contributor Checklist

- `npm install` completed in `backend/`
- `.env` created from `.env.example`
- Backend starts without crash
- `seed:admin` executed successfully
- Login works and JWT is returned
- Owner can create/read/update menu items
- Owner can upload an image and see it on owner/client menus
- Admin can set tables and see QR values
- Guest can open a QR menu with `?table=1`, add items to cart, and place an order

