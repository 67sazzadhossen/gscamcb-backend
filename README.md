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

Set `DATABASE_URL` in `.env` to your Neon PostgreSQL connection string, including `sslmode=require`. Keep `.env` out of Git. `db:push` applies schema changes to the configured database, so review the URL before running it. For the existing pre-StudentInfo schema, run `npm run db:refactor-student` during the deployment of this refactor before starting the new backend. Do not use db:push to replace this data migration. Fresh databases can use db:push.

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

This backend includes authentication, role permissions, shared users/profiles, student collection and admission, classes/sections, fee settings, waivers, home visits, and recycle-bin management. Attendance, billing receipts, and frontend authentication integration are separate future features.

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

Import the `gscamcb-backend` GitHub repository into Vercel using the Express preset. The checked-in `vercel.json` runs `npm ci --include=dev` (so build tools are installed even with `NODE_ENV=production`) and `npm run build`, generating Prisma before compiling. The `postinstall` script also generates the client immediately after dependency installation. Node.js is pinned to 22.x. Vercel uses the exported app in `src/app.ts`; `src/server.ts` remains the local server entry point.

Set these environment variables in Vercel before deploying:

- `DATABASE_URL`: your Neon PostgreSQL connection URL with SSL enabled.
- `NODE_ENV`: `production`.
- `CORS_ORIGIN`: your frontend origin (comma-separated if needed).
- `JWT_SECRET`: a random secret of at least 32 characters.
- `DEFAULT_PASSWORD`: initial account password, at least 8 characters, used when an administrator does not supply a password.
- `BCRYPT_SALT_ROUNDS`: hashing rounds, typically 12.

Local `.env` files are excluded from deployment. Schema changes are not run automatically during builds. Verify `/` and `/api/v1/health` after deployment; health reports process status, not database connectivity.

## Users, profiles, and super admin

Roles: `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`, `ACCOUNTANT`, `STAFF`. Shifts: `MORNING`, `DAY`.

The public school user ID is a string with exactly eight digits: `YY + RR + S + NNN`. Role codes are `01` super admin, `02` admin, `03` teacher, `04` student, `05` accountant, `06` staff. Shift codes are `1` morning and `2` day. Example: `26041001` is the first morning-shift student created in 2026. The year uses Asia/Dhaka time. Serials start at `001` independently for each year/role/shift, with a maximum of `999`. Exceeding that limit returns 409. The PostgreSQL counter increments atomically inside the user/profile creation transaction. UUIDs remain the internal primary keys; the generated school ID, role, and shift cannot be edited through account updates.

`User` stores account identity, hashed password, role, and status. Its one-to-one `Profile` stores a required Name relation, optional Image relation, shift, phone, addresses, date of birth, gender, blood group and shared personal details. Optional one-to-one StudentInfo and EmploymentInfo relations hold the data for each type. Password hashes are excluded from API responses. Accounts start with `mustChangePassword=true` and must change their password before accessing management endpoints.

Set `JWT_SECRET` to a random value at least 32 characters long in local and Vercel environments. Tokens expire after one hour. Refresh tokens are not implemented. The frontend supports ID/password sign-in, session verification and mandatory initial password change.

Configure `SUPER_ADMIN_NAME`, `SUPER_ADMIN_EMAIL`, and `DEFAULT_PASSWORD` in the ignored `.env`, then run:

```bash
npm run db:push
npm run seed:super-admin
```

The seed creates a morning-shift super admin and a profile. Rerunning it does not reset the existing password or promote an account with another role. The initial seed credentials are local configuration and must not be committed.

| Endpoint                            | Access                                                                                                                                                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/v1/auth/login`           | Body: `{ userId, password }`; userId is the eight-digit school ID; email sign-in is disabled                                                                                                                     |
| `POST /api/v1/auth/change-password` | Signed in; body: `{ currentPassword, newPassword }`                                                                                                                                                              |
| `GET /api/v1/users/me`              | Signed in                                                                                                                                                                                                        |
| `POST /api/v1/users`                | Admin/super admin; role, required profile; staff email required, student email optional; password optional (uses DEFAULT_PASSWORD) (name, shift, optional image, studentInfo or employmentInfo and other fields) |
| `GET /api/v1/users`                 | Admin/super admin; paginated with page/limit and optional role/shift/status filters                                                                                                                              |
| `GET /api/v1/users/:userId`         | Admin/super admin                                                                                                                                                                                                |
| `PATCH /api/v1/users/:userId`       | Admin/super admin; email, status only                                                                                                                                                                            |
| `GET /api/v1/profiles/me`           | Signed in                                                                                                                                                                                                        |
| `PATCH /api/v1/profiles/me`         | Signed in; personal profile fields only                                                                                                                                                                          |

Send `Authorization: Bearer <accessToken>` on protected requests. Administrators and super admins can create and manage admins; the account update endpoint does not modify super-admin accounts. Blocking an account denies subsequent authenticated requests. This module does not create fabricated sample accounts for the other roles; admins create actual school users through the shared endpoint.

`BCRYPT_SALT_ROUNDS` configures password hashing (default 12; supported range 10–15). The super-admin seed reads `DEFAULT_PASSWORD`; rerunning the seed never overwrites an existing account password.

Existing names and shifts were moved from `users` to `profiles` using the transactional SQL in `scripts/sql/move-profile-fields.sql`. It is a one-time transition for the old schema; do not run it on a fresh database. School user IDs and credentials remain unchanged.

### Names, guardians, and images

`Name` is a shared table used by Profile, Guardian, and LocalGuardian. It contains firstName, optional middleName, lastName, and optional bengaliFirstName/bengaliMiddleName/bengaliLastName. Each person record has its own required name relation. Guardian records retain relationship, phone, email, address, and occupation.

StudentInfo includes optional `version` (`ENGLISH` or `BANGLA`) and `isCadet` (defaults to false). Existing versions remain unset until selected. Image stores `displayUrl` and a unique Cloudinary `publicId`, linked optionally to a profile. The API accepts upload metadata; it does not upload or delete Cloudinary assets yet.

Supply names under `profile.name`, `profile.studentInfo.guardian.name`, and `profile.studentInfo.localGuardian.name`. Updates supply complete name objects (firstName and lastName are required). Common profile updates manage image metadata; student-info updates manage guardian records. Omitted relations remain unchanged. Names and image metadata are included in user/profile responses.

Example profile payload:

```json
{
  "name": {
    "firstName": "Md",
    "middleName": "Sazzad",
    "lastName": "Hossen"
  },
  "shift": "MORNING",
  "studentInfo": {
    "version": "BANGLA",
    "isCadet": false
  },
  "image": {
    "displayUrl": "https://res.cloudinary.com/YOUR-CLOUD/image/upload/photo.webp",
    "publicId": "profiles/photo"
  }
}
```

The transactional scripts in `scripts/sql/` preserve data while transitioning the prior schemas. They are one-time transitions, not fresh-database setup scripts. The final transition moves names into `names` and creates the `images` table. Database-only deletion of an owner does not remove its linked Name row automatically; the permanent student deletion service removes unused owned Name records explicitly. Image metadata cascades when its profile is deleted; Cloudinary resource cleanup requires the future upload/deletion integration.

### Student academic and payment info

`AcademicInfo` stores admissionClassId, currentClassId, optional sectionId, optional rollNumber, and academicYear. Class names are returned through relations. `PaymentInfo` stores admissionFee, annualFee, monthlyFee, and academicYear. Both are optional one-to-one profile relations and only apply to students. Fees use Decimal(12,2) and serialize as decimal strings. These are current fee settings, not payment receipts or academic history.

Provide `profile.studentInfo.academicInfo` and `profile.studentInfo.paymentInfo` when creating a student. Existing students can initialize each with POST `/api/v1/academic-info/:userId` and `/api/v1/payment-info/:userId`. GET/PATCH are available on the same paths. Academic management requires admin or super admin; payment management also permits accountants. Students cannot change academic or payment info through self-profile updates.

Use POST `/api/v1/academic-info/:userId/promote` to update class and year together with optional fees:

```json
{
  "currentClassId": "CLASS_UUID",
  "sectionId": "SECTION_UUID",
  "rollNumber": 1,
  "academicYear": 2027,
  "paymentInfo": {
    "annualFee": "3500.00",
    "monthlyFee": "1700.00"
  }
}
```

Promotion preserves the original admissionClassId, requires a later academic year, and updates both records atomically. Existing payment info advances to the same year even when no fee changes are supplied. Supplying new fees requires an initialized PaymentInfo record. Duplicate/conflicting promotions are rejected. Omitted fee values remain unchanged. Direct academic PATCH supports corrections; use the promotion endpoint for coordinated yearly changes.

The one-time `scripts/sql/separate-academic-info.sql` transition copies existing class/year information into AcademicInfo before dropping class columns from PaymentInfo.

### Admin-managed classes and sections

- `GET /api/v1/classes`: signed-in users can list classes with their sections.
- `POST /api/v1/classes`: admin/super admin; body `{ "name": "Class 1" }`.
- `PATCH /api/v1/classes/:id`: admin/super admin; rename a class.
- `GET /api/v1/sections?classId=CLASS_UUID`: signed-in users; optional class filter.
- `POST /api/v1/sections`: admin/super admin; body `{ "name": "A", "classId": "CLASS_UUID" }`.
- `PATCH /api/v1/sections/:id`: admin/super admin; rename only. Class ownership cannot change.

Names are unique for classes, and section names are unique within their class. Academic creation accepts UUIDs for admissionClassId/currentClassId/sectionId. Both the service and composite database foreign key ensure sectionId belongs to currentClassId. Assigned roll numbers must be positive and unique within class + section + year. Unassigned section/roll fields remain null; roll uniqueness is enforced when both are assigned.

During promotion, supply new sectionId and rollNumber if applicable. Omitted placement fields are cleared rather than carrying the previous year's section/roll. Direct class corrections also clear section/roll unless replacements are supplied. AdmissionClassId remains unchanged. Referenced classes/sections cannot be removed while in use; deletion endpoints are not provided.

`scripts/sql/class-section-relations.sql` preserves old class labels by creating matching Class records and replacing labels with IDs. Existing section/roll information is left unset rather than guessed.

### Prospect collection, home visits, and admission

New students, including home-visit prospects, are saved in the common User + Profile tables with an eight-digit school ID immediately. Name and shift are required; student email, initial password, placement and fees are optional. Omitted passwords use DEFAULT_PASSWORD. The collector comes from the authenticated teacher/admin session. Saved students start at PROSPECT, and cannot sign in until ADMITTED; account ACTIVE/BLOCKED remains the separate manual login setting.

Admission statuses: PROSPECT, FOLLOW_UP, INTERESTED, APPLIED, ADMITTED, NOT_INTERESTED, CANCELLED. After admission, studentStatus is ACTIVE, ON_LEAVE, TRANSFERRED, WITHDRAWN or GRADUATED. Promotion requires an active admitted student. Admission approval never clears a manually blocked account.

| Endpoint                                             | Behavior                                                                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/v1/students/prospects`                    | Teacher/admin creates User + Profile; flat profile payload with name and shift, optional email/password                   |
| `GET /api/v1/students/prospects`                     | Paginated, optional admissionStatus; teachers see their collected students                                                |
| `GET /api/v1/students/prospects/:profileId`          | Teacher owner or admin                                                                                                    |
| `PATCH /api/v1/students/prospects/:profileId`        | Update saved personal details, planned studentInfo.academicInfo and studentInfo.paymentInfo; identity/shift cannot change |
| `PATCH /api/v1/students/prospects/:profileId/status` | Change recruitment status; ADMITTED delegates to the administrator-only admission transaction                             |
| `POST /api/v1/students/prospects/:profileId/admit`   | Administrator confirms using saved placement/fees; body can be empty or supply academicInfo/paymentInfo/email             |
| `POST /api/v1/students/prospects/:profileId/visits`  | Record notes, optional visitDate and nextFollowUpDate; visitor comes from session                                         |
| `GET /api/v1/students/prospects/:profileId/visits`   | Home-visit history with recording staff identity                                                                          |
| `GET /api/v1/students/collection-summary/me`         | Own totalCollected, totalAdmitted, pending and statusCounts                                                               |
| `GET /api/v1/students/collection-summary/:teacherId` | Administrator views a teacher's totals; teacherId is the eight-digit school ID                                            |

Before admission, save admissionClassId, currentClassId, academicYear and complete admission/annual/monthly fees. Payment and academic years must match. Section must belong to the selected class. Once complete, an administrator can send just `{ "admissionStatus": "ADMITTED" }`. Missing data returns a validation error without changing admission status. Approval preserves the account, school ID, password, profile, collector and visit history, records admittedById, and sets the admission date/year and ACTIVE studentStatus atomically. Repeated admission is rejected. Admission date defaults to today's school date in Asia/Dhaka; explicit admission date/year may be supplied to the admit endpoint and must agree. Current academicYear is independent and changes on promotion.

HomeVisit retains visitedById, visitDate, notes and nextFollowUpDate. Teachers can manage only students they collected and cannot confirm admission. Submitted collector/visitor/approver IDs are rejected. Teacher summaries derive counts from student records rather than storing duplicated counters. Legacy unlinked profiles remain readable; admission can attach their first account without losing their data.

### Shared staff employment information

All roles reuse User for credentials and Profile for names, image, contact, address and personal details. Non-student roles can add `profile.employmentInfo` at creation: designation, department, joiningDate, qualification, specialization, optional monthlySalary (Decimal(12,2), non-negative) and employmentStatus (ACTIVE, ON_LEAVE, RESIGNED, TERMINATED). The employment record is a one-to-one profile relation. School ID serves as the employee identifier; names, shift, phone, credentials and images are not copied into employment data. Employment status describes employment and does not automatically change login account status.

`PUT /api/v1/employment-info/:userId` saves staff employment details; GET users/profiles responses already include them. Only administrators manage employment records, and only a super admin modifies another administrator's employment. Protected super-admin records cannot be modified through this route. Students cannot receive employmentInfo; academicInfo/paymentInfo are for students only. Salary payroll and teacher subject assignments require their own future workflows.

### Blocking and recycle bin

User includes `isDeleted` and `deletedAt`; blocking uses the existing ACTIVE/BLOCKED `status` enum. Login and authenticated requests reject deleted or BLOCKED accounts immediately. `PATCH /api/v1/users/:userId` accepts `{ "status": "BLOCKED" }` or ACTIVE. Normal account lists and reads exclude deleted records; email and school ID stay reserved while in the recycle bin.

Admin/super-admin endpoints:

| Endpoint                                                 | Behavior                                            |
| -------------------------------------------------------- | --------------------------------------------------- |
| `DELETE /api/v1/users/:userId`                           | Soft delete; retain all data                        |
| `GET /api/v1/users/recycle-bin`                          | Paginated deleted accounts                          |
| `PATCH /api/v1/users/:userId/restore`                    | Restore; retain prior blocked state                 |
| `DELETE /api/v1/users/:userId/permanent`                 | Permanently remove a student already in recycle bin |
| `GET /api/v1/students/recycle-bin`                       | Deleted student accounts and saved prospects        |
| `DELETE /api/v1/students/prospects/:profileId`           | Recycle a saved prospect or student                 |
| `PATCH /api/v1/students/prospects/:profileId/restore`    | Restore a saved prospect or student                 |
| `DELETE /api/v1/students/prospects/:profileId/permanent` | Permanently delete from recycle bin only            |

New prospects and admitted students use User.isDeleted/deletedAt. Legacy standalone prospects retain Profile deletion flags until an account is attached. Teachers cannot access recycle-bin management. Super-admin accounts cannot be recycled, blocked, or permanently deleted through these routes. Admin accounts require a super admin to modify. Permanent account deletion currently supports students only; staff accounts can be recycled/restored.

Permanent student deletion removes profile, guardian/local-guardian records, owned Name records, image metadata, academic/payment settings, and home visits in a transaction. Existing classes, sections, collector accounts, and ID counters are retained. Shared Name rows still referenced elsewhere are preserved. Cloudinary resource deletion is pending the upload integration; deleting metadata does not remove the remote asset.

### Optional personal details and admission approver

Profile accepts optional birthRegistrationNumber (digits stored as a string, preserving leading zeros), nationality, religion, emergencyContactName, emergencyContactPhone, emergencyRelationship, and medicalNotes. These use the existing profile create/update validation and access controls; no duplicate contact or status tables were added.

AcademicInfo.admittedById references the administrator who confirmed admission. Only admission confirmation obtains the approver ID from the authenticated administrator session; creating a student or saving planned academic data does not approve admission. Clients cannot provide or edit it. Responses include the approver's school ID and name through the relation. Existing unknown approvers remain unset. CollectedById remains separate and continues identifying the collecting teacher.

### Address, transportation, and waivers

Profile now references `presentAddress` and `permanentAddress` in a shared Address table. Guardian and LocalGuardian reference that same table. The old raw address columns were removed after migrating their data. Previous Profile.address values become present addresses; unknown permanent addresses remain unset.

Address input is `{ "addressLine": "Cantonment, Mymensingh" }`. Whitespace is normalized, and addressLine is unique. Identical normalized values reuse one record, including when present/permanent/guardian addresses match. Changing an address reconnects only that relation; it does not edit the shared row and unexpectedly change someone else's address. No sameAsPresent flag or second copied address is stored.

Transportation is only `Profile.usesTransport` (boolean, default false), as requested. No transportation table, route, or copied fee fields were added.

Waiver holds profileId, feeType (`ADMISSION`, `ANNUAL`, `MONTHLY`), discountType (`AMOUNT`, `PERCENTAGE`), one decimal value, validity dates, reason, status, and requester/decision attribution. It does not copy original fees or calculated net fees. Values must be positive; percentages cannot exceed 100. An end date is optional but cannot precede the start date.

- `POST /api/v1/waivers/:userId`: admin/super admin/accountant; request a waiver.
- `GET /api/v1/waivers/:userId`: admin/super admin/accountant; list a student's waiver history.
- `PATCH /api/v1/waivers/:id/decision`: admin/super admin; `{ "status": "APPROVED" }`, REJECTED, or REVOKED.

Requests always start PENDING. Requester and decision-maker IDs come from the session. Only pending waivers can be approved/rejected; only approved waivers can be revoked. Overlapping approved waivers for the same student, fee type, and inclusive validity period are rejected with a transaction lock to cover concurrent decisions. Waivers do not automatically change PaymentInfo or issue receipts; fee assessment can apply approved waivers later.

Permanent profile deletion removes its waivers and unused address records. Address records still used by other profiles or guardians are preserved. `scripts/sql/shared-addresses.sql` is the one-time data-preserving transition for the prior raw address columns.

### Profile separation and existing database upgrade

Common Profile fields have one source: names, image, shift, contact, addresses and personal/emergency details. StudentInfo owns version, isCadet, usesTransport, birthRegistrationNumber, collector, guardian/localGuardian, AcademicInfo, PaymentInfo, HomeVisit and Waiver relations. EmploymentInfo owns employee-specific details and monthlySalary. Account login/deletion settings remain in User; Profile deletion flags support legacy unlinked records only.

Creation payloads and responses nest student-specific data under `profile.studentInfo`. The prospect endpoint still accepts common profile fields directly, with student-specific fields under `studentInfo`. Sending old flat student fields or a mixture of duplicate flat/nested fields returns a validation error. Staff cannot receive StudentInfo, and students cannot receive EmploymentInfo.

`PATCH /api/v1/students/prospects/:profileId/info` updates student-specific personal details/guardians. A collecting teacher may update their own pending student; admitted student edits require an administrator. Common profile PATCH rejects student and employee-specific fields. Draft PATCH accepts common fields and nested studentInfo; academic/fee management and admission paths retain their existing routes.

The one-time `npm run db:refactor-student` executes scripts/sql/separate-student-info.sql in a single locked transaction. It copies existing student values before removing their old columns, verifies the copy, and renames child ownership columns instead of deleting/recreating records. Existing account IDs, names, addresses, classes, fees, visit/waiver history, guardian IDs and timestamps are retained. Profile identity remains stable. The migration includes legacy profiles with student-specific data regardless of account role, to prevent data loss. Its retained StudentInfo IDs equal their old profile IDs for this transition; new students get independent UUIDs. It does not fabricate admission data or reset passwords/statuses.

Apply this migration together with deploying the new backend: the old deployed Prisma client expects the previous schema. Build scripts do not apply it automatically. The migration runner skips databases already upgraded or created with the new schema.

### Role demo accounts and ID login

Run `npm run seed:roles` to ensure there is an active account for ADMIN, TEACHER, ACCOUNTANT, STAFF and an admitted STUDENT alongside the existing super admin. Existing eligible accounts and passwords are preserved. New accounts are labelled Demo and use example.com contact emails and DEFAULT_PASSWORD, with mandatory initial password change. The demo student uses Demo Class / Demo Section and zero fee settings; these are sample data, not real school fees. Repeated runs reuse existing accounts without creating duplicates. IDs are printed; passwords are not.

All roles sign in through `POST /api/v1/auth/login` with `{ "userId": "EIGHT_DIGIT_ID", "password": "PASSWORD" }`. Email is contact data only. Blocked, recycled and pending students cannot sign in.
