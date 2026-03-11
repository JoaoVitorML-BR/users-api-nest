# Users Module - AI Context Guide

This document explains how the users module is structured, which business rules must be preserved, and how responses and tests are expected to behave.

## Goal

Provide user lifecycle operations with clear role-based access rules:

1. Public user registration.
2. Admin-only admin creation.
3. Authenticated user update.
4. Authenticated password update (self only).
5. User listing and retrieval with role checks.
6. Public user lookup by username.
7. Private user lookup by email.

## Folder Structure

- `dto/`
  - Input/output contracts using `class-validator` and `class-transformer`.
  - `api-response.dto.ts` defines module response shape.

- `user.controller.ts`
  - HTTP routes under `/users`.
  - Keeps orchestration thin by delegating to use cases.

- `user.service.ts`
  - Data-access boundary with TypeORM repository operations.
  - Central point for persistence logic.

- `use-cases/`
  - Business orchestration layer.
  - One use case per file, following clean architecture separation.

- `email-confirmation/`
  - Handles confirmation token/email flow used after user creation.

## Clean Architecture Rules (Do Not Break)

1. One use case per file.
	- Keep each business action isolated in its own class/file.
	- Current examples:
	  - `create-users.use-case.ts`
	  - `create-users-admin.use-case.ts`
	  - `find-all-users.use-case.ts`
	  - `find-by-id-users.use-case.ts`
	  - `update-user.use-case.ts`
	  - `update-user-password.use-case.ts`

2. Keep controller thin.
	- Controller should call use cases and not implement business rules.
	- Controller is responsible for the HTTP response envelope.

3. Keep persistence in service layer.
	- TypeORM queries should stay in `user.service.ts`.

4. Keep DTO validation declarative.
	- Input constraints should remain in DTO decorators.

5. Keep side-effects explicit.
	- User creation triggers email confirmation token send use case.

## End-to-End Logic by Endpoint

### 1) `POST /users` (Public registration)

1. Validate payload (`name`, `username`, `email`, `password`).
2. Hash password with bcrypt.
3. If this is the first user in DB, assign `ADMIN_MASTER` role.
4. Otherwise, ensure email/username uniqueness and assign `USER` role.
5. Create user and trigger confirmation email token send.
6. Return creation response envelope.

### 2) `POST /users/create-admin` (Admin creation)

1. Protected by `JwtGuard + RolesGuard`.
2. Requires role: `ADMIN_MASTER`.
3. Validate payload and uniqueness.
4. Hash password and create user with `ADMIN` role.
5. Trigger confirmation email token send.
6. Return creation response envelope.

### 3) `GET /users` (List users)

1. Protected by `JwtGuard + RolesGuard`.
2. Allowed roles: `ADMIN_MASTER`, `ADMIN`.
3. Fetch selected safe fields only.
4. Return response envelope with `data` list.

### 4) `GET /users/:id` (Get user by id)

1. Protected by `JwtGuard + RolesGuard + AuthorizationGuard`.
2. Allowed roles: `ADMIN_MASTER`, `ADMIN`, `USER`.
3. Validate `id` and ensure user exists.
4. Return selected safe fields.

### 5) `PATCH /users/:id` (Update profile fields)

1. Protected by `JwtGuard + RolesGuard + AuthorizationGuard`.
2. Allowed roles: `ADMIN_MASTER`, `ADMIN`, `USER`.
3. Require at least one updatable field (`name` or `username`).
4. Ensure target user exists.
5. Update user and return response envelope with updated data.

### 6) `PATCH /users/password/:id` (Update password)

1. Protected by `JwtGuard`.
2. Enforce self-update (`loggedUserId === id`).
3. Validate current password with bcrypt compare.
4. Ensure `newPassword === confirmNewPassword`.
5. Hash and persist new password.
6. Return success envelope with `data: null`.

### 7) `GET /users/email/:email` (Find by email - private)

1. Protected by `JwtGuard`.
2. `ADMIN_MASTER` and `ADMIN` can fetch any email.
3. `USER` can fetch only own email.
4. Returns user safe fields if found.

### 8) `GET /users/username/:username` (Find by username - public)

1. Public route (no auth guard).
2. Username normalized to lowercase before search.
3. Returns user safe fields if found.

## Security and Authorization Rules

1. Never store plaintext passwords.
	- Always hash with bcrypt before persistence.

2. Keep self-password-change restriction.
	- A user can only change their own password.

3. Preserve role restrictions on admin/list routes.
	- `create-admin` must stay `ADMIN_MASTER` only.
	- `GET /users` must stay `ADMIN_MASTER` or `ADMIN` only.

4. Keep duplicate user prevention.
	- Must validate email and username uniqueness before create.

5. Keep safe field projection.
	- List/find operations should avoid returning sensitive fields like password.

6. Keep email privacy by role.
	- Email lookup must not expose arbitrary users to regular users.
	- Only admins can query any email.

## Response Contract

Module follows the global API envelope:

- `statusCode`
- `status`
- `code`
- `message`
- `data` (optional on success, null on errors via global exception layer)

### Return Rules

- Success (`2xx`) should return meaningful `data` when applicable.
- Error (`4xx/5xx`) should be normalized by filters with `data: null`.
- For successful operations without payload (example: password update), `data` may be `null`.

### Current Practical Returns

| Endpoint | Success Status | Success `data` behavior | Common error status |
|---|---|---|---|
| `POST /users` | `201` | Created user in `data` | `400`, `409`, `500` |
| `POST /users/create-admin` | `201` | Created admin user in `data` | `400`, `409`, `500`, `403` |
| `GET /users` | `200` | Array of users in `data` | `401`, `403`, `500` |
| `GET /users/:id` | `200` | User object | `400`, `401`, `403`, `404` |
| `PATCH /users/:id` | `200` | Updated user in `data` | `400`, `401`, `403`, `404` |
| `PATCH /users/password/:id` | `200` | `data: null` | `400`, `401`, `403`, `404` |
| `GET /users/email/:email` | `200` | User object | `400`, `401`, `403`, `404` |
| `GET /users/username/:username` | `200` | User object | `400`, `404` |

## DTO and Validation Notes

1. `CreateUserDTO`
	- Username normalized to lowercase.
	- Email normalized to lowercase.
	- Strong password policy enforced.

2. `UpdateUserDTO`
	- Supports `name` and `username` updates.
	- Use case also enforces at least one field at runtime.

3. `UpdatePasswordUserDTO`
	- Requires current/new/confirm passwords.
	- Strong password policy enforced on new and confirm values.

## Testing Guide (Important for AI Context)

This module already has unit test coverage across controller, service, and key use cases.

### Existing Test Files

- `user.controller.spec.ts`
- `user.service.spec.ts`
- `use-cases/create-users.use-case.spec.ts`
- `use-cases/find-all-users.use-case.spec.ts`
- `use-cases/update-user.use-case.spec.ts`
- `use-cases/update-user-password.use-case.spec.ts`

### Commands

- Run all unit tests:
  - `npm run test`
- Run with coverage:
  - `npm run test:cov`
- Run e2e suite:
  - `npm run test:e2e`
- Run a single test file example:
  - `npx jest src/modules/users/use-cases/create-users.use-case.spec.ts`

### What to Test When Adding/Changing a Use Case

1. Happy path response and expected status/code/message.
2. Validation failures (`BadRequestException`).
3. Authorization/ownership failures (`ForbiddenException`) where relevant.
4. Not found behavior (`NotFoundException`).
5. Conflict behavior for duplicate user scenarios.
6. Service failures propagated or normalized correctly.
7. Side effects (email token send call) for user creation flows.

### Testing Conventions

1. Prefer mocking `UserService` and dependent use cases in unit tests.
2. Keep tests focused on behavior, not framework internals.
3. Use descriptive test names documenting business rule intent.
4. Keep one spec file per use case file when possible.

## Common Future Improvements

1. Add unit tests for `find-by-id-users.use-case.ts` and `create-users-admin.use-case.ts`.
2. Remove debug `console.log` from `GET /users/:id` controller path.
3. Standardize create endpoints to always include explicit `data` payload for consistency.
