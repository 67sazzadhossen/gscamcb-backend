# GSCAMCB backend

Express + TypeScript + Prisma + PostgreSQL foundation for the school management system.

Follows the route/controller/service module pattern from [gscam-server](https://github.com/67sazzadhossen/gscam-server) and the split Prisma schema/shared client layout from [jfp-server](https://github.com/67sazzadhossen/jfp-server). Prisma 6.19 uses a direct PostgreSQL connection without the reference's MySQL adapter. No reference credentials, generated clients, or school business logic are copied.

## Run locally

Use Node.js 22 or newer. From this folder:

```bash
npm install
cp .env.example .env
# Set DATABASE_URL to your PostgreSQL connection string.
npm run prisma:generate
npm run db:push
npm run dev
```

Set `DATABASE_URL` in `.env` to your Neon PostgreSQL connection string, including `sslmode=require`. Keep `.env` out of Git. `db:push` applies schema changes to the configured database, so review the URL before running it. For a production migration history, use Prisma Migrate instead of `db:push`.

`http://localhost:5000/` returns the server message. `GET /api/v1/health` returns process health; it does not query PostgreSQL. Server startup connects to PostgreSQL before accepting requests.

## Structure

```text
prisma.config.ts
prisma/
  schema/
    schema.prisma             # PostgreSQL datasource and client generator
    user.prisma               # Minimal starter model
  lib/prisma.ts               # Shared Prisma client
  generated/prisma/           # Generated, ignored by Git
src/
  app.ts
  server.ts
  app/
    config/
    errors/
    middlewares/
    modules/health/
      health.interface.ts
      health.service.ts
      health.controller.ts
      health.route.ts
    routes/
    types/
    utils/
      catchAsync.ts
      sendResponse.ts
tests/
```

Add each feature under `src/app/modules/<feature>` with `<feature>.route.ts`, `<feature>.controller.ts`, `<feature>.service.ts`, `<feature>.interface.ts`, and `<feature>.validation.ts` as needed. Register routes in `src/app/routes/index.ts`. Add database models as `.prisma` files in `prisma/schema/`, then regenerate the client and push the schema. Prisma schema models define the database tables.

Controllers use `catchAsync` and `sendResponse`; services import `prisma` from `prisma/lib/prisma.ts`. Apply `validateRequest(z.object({...}))` to validate the request body. It replaces `req.body` with parsed/transformed data. Throw `AppError` for expected HTTP errors. The global handler normalizes Zod, Prisma, malformed JSON, and application errors; stack traces appear only in development.

Success responses: `{ success, message, data }`. Error responses: `{ success: false, message, errorSources, stack }`. The response helper fixes the reference's accidental nested response payload.

This setup contains a health module and a minimal User schema. Authentication, permissions, students, teachers, attendance, and other school features are not implemented yet.

## Commands

- `npm run dev` / `npm run start:dev`: development server with reload.
- `npm run build`: generate Prisma client and compile to `dist/`.
- `npm start` / `npm run start:prod`: run compiled server.
- `npm run format`: format source and configuration files with Prettier.
- `npm run format:check`: check formatting without modifying files.
- `npm run verify`: schema validation, type checking, lint, HTTP tests, and build.
- `npm run db:push`: apply PostgreSQL schema changes.
- `npm run prisma:studio`: browse the configured database.

`PORT` defaults to 5000. `CORS_ORIGIN` supports comma-separated frontend origins and defaults to `http://localhost:3000`. Set `NODE_ENV=production` in production. Database integration requires your actual PostgreSQL instance; HTTP tests do not connect to a database.

## Dependency audit

The online npm audit during setup reported four high-severity advisories in the Prisma 6 CLI/config development dependency chain (`prisma`, `@prisma/config`, `effect`, and `deepmerge-ts`). The suggested automatic fix downgrades Prisma to 6.12, so it was not applied. Review a compatible patched Prisma release before deployment; keep CLI dependencies out of the runtime installation where practical. Recheck with `npm audit` when upgrading dependencies.

## Vercel deployment

Import the `gscamcb-backend` GitHub repository into Vercel using the Express preset. The checked-in `vercel.json` runs `npm ci` and `npm run build`, generating Prisma before compiling. Node.js is pinned to 22.x. Vercel uses the exported app in `src/app.ts`; `src/server.ts` remains the local server entry point.

Set these environment variables in Vercel before deploying:

- `DATABASE_URL`: your Neon PostgreSQL connection URL with SSL enabled.
- `NODE_ENV`: `production`.
- `CORS_ORIGIN`: your frontend origin (comma-separated if needed).

Local `.env` files are excluded from deployment. Schema changes are not run automatically during builds. Verify `/` and `/api/v1/health` after deployment; health reports process status, not database connectivity.
