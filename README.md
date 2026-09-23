# Help desk API

A small help desk backend: requesters open tickets, agents follow them up and comment until they are solved.

Built with Node.js, TypeScript, Express and SQLite (`better-sqlite3`). The database schema lives in versioned SQL migrations under `migrations/`.

## Requirements

- Node.js 20 or newer
- npm

SQLite is embedded, so there is no database server to install. The database is a single file (`helpdesk.db` by default).

## Running locally

```bash
# 1. Install dependencies
npm install

# 2. Configure the environment (port and database file)
cp .env.example .env

# 3. Create the database and apply the migrations
npm run migrate

# 4. Start the API (http://localhost:3000)
npm run dev
```

For a production-like run: `npm run build && npm start`.

`npm run migrate` only applies migrations that were not applied yet (they are tracked in the `schema_migrations` table), so it is safe to run it again after pulling new migrations.

## Authentication

Register with `POST /auth/register` and log in with `POST /auth/login`. The login returns a JWT; send it on the ticket routes as `Authorization: Bearer <token>`.

Roles:

- `solicitante`: default for every new account. Opens tickets and sees their own tickets in the list.
- `atendente`: sees every ticket and can change the status.

To make a user an agent run `npm run promote-agent -- email@example.com` (the user must log in again to get a token with the new role).

## Example requests

```bash
curl -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name": "Ana", "email": "ana@example.com", "password": "123456"}'

curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email": "ana@example.com", "password": "123456"}'

curl -i -X POST http://localhost:3000/tickets \
  -H "Authorization: Bearer <token>" \
  -H 'Content-Type: application/json' \
  -d '{"title": "Printer on 2nd floor is not working", "priority": "alta"}'
```

## Routes

| Method | Route                   | Description                                       |
| ------ | ----------------------- | ------------------------------------------------- |
| POST   | `/auth/register`        | Create an account (`name`, `email`, `password`)   |
| POST   | `/auth/login`           | Log in, returns `{ token, user }`                 |
| GET    | `/auth/me`              | Current user                                      |
| POST   | `/tickets`              | Create a ticket (`201`)                           |
| GET    | `/tickets`              | List tickets. Query: `status`, `page`, `limit`    |
| GET    | `/tickets/:id`          | Ticket detail                                     |
| PATCH  | `/tickets/:id`          | Update a ticket (only agents can change `status`) |
| POST   | `/tickets/:id/comments` | Add a comment (`body`)                            |
| GET    | `/tickets/:id/comments` | List the comments of a ticket                     |

Allowed values:

- `priority`: `baixa`, `media` (default), `alta`
- `status`: `aberto` (default), `em_andamento`, `resolvido`, `fechado`

Both are also enforced in the database with `CHECK` constraints.

## Errors

Errors are JSON with an `error` message. Validation errors (`422`) also include `fields` with the problems per field:

```json
{ "error": "Validation failed", "fields": { "title": ["Required"] } }
```

## Scripts

| Script            | What it does                        |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start the API with reload on change |
| `npm run migrate` | Apply pending migrations            |
| `npm run build`   | Compile TypeScript to `dist/`       |
| `npm start`       | Run the compiled API                |
| `npm run lint`    | ESLint and type check               |
