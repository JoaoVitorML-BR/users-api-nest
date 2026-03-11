# Auth Module - AI Context Guide

This document explains how the auth module is structured, which behaviors are expected, and which rules must be preserved when changing authentication flows.

## Goal

Provide secure authentication lifecycle operations:

1. Login with username/email + password.
2. Refresh access token using refresh token rotation.
3. Logout by invalidating persisted refresh token.
4. Integrate with password reset flow (documented in `password-reset/README.ai.md`).

## Folder Structure

- `auth.controller.ts`
  - HTTP routes under `/auth`.
  - Responsible for HTTP response envelope formatting.

- `auth.service.ts`
  - Token generation and user validation support logic.

- `use-cases/auth-login.use-case.ts`
  - Authentication orchestration logic.
  - Contains credential checks, refresh flow, and logout business actions.

- `guards/` and `strategies/`
  - JWT validation and route protection.

- `dto/`
  - Request/response contracts used by controller and use case layers.

- `password-reset/`
  - Dedicated submodule for forgot/reset password flow.
  - See `password-reset/README.ai.md` for detailed rules.

## End-to-End Logic

### 1) `POST /auth/login`

1. Validate login payload.
2. Resolve user by username or email.
3. Validate password with bcrypt.
4. Generate access + refresh tokens.
5. Hash refresh token before persisting.
6. Return response envelope with user and tokens.

### 2) `POST /auth/refresh`

1. Validate and decode refresh token.
2. Ensure token type is `refresh`.
3. Load active user.
4. Compare raw refresh token with stored hash.
5. Generate new token pair (rotation).
6. Persist new hashed refresh token.
7. Return response envelope with new tokens.

### 3) `POST /auth/logout`

1. Requires authenticated user context.
2. Clear persisted refresh token if present.
3. Return success response envelope with `data: null`.

## Security Rules (Do Not Break)

1. Never persist raw refresh tokens.
   - Store only bcrypt hash.

2. Always rotate refresh tokens.
   - New refresh token must replace old hash.

3. Keep strict token type checks.
   - Reject non-refresh tokens in refresh endpoint.

4. Keep generic unauthorized errors.
   - Avoid leaking sensitive account details.

5. Preserve throttling on login/refresh routes.
   - Helps protect against brute force and abuse.

## Response Contract

Controller returns the module envelope:

- `statusCode`
- `status`
- `code`
- `message`
- `data`

Use case layer should return business data only (not HTTP envelopes).

## Current Routes and Returns

| Endpoint | Success Status | Success `data` behavior | Common error status |
|---|---|---|---|
| `POST /auth/login` | `200` | User + access/refresh tokens | `401` |
| `POST /auth/refresh` | `200` | New access/refresh tokens | `401` |
| `POST /auth/logout` | `200` | `data: null` | `401` |

## Testing Guide

### Key Test Files

- `auth.controller.spec.ts`
- `use-cases/auth-login.use-case.spec.ts`
- `password-reset/password-reset.controller.spec.ts`
- `password-reset/use-case/*.spec.ts`

### Commands

- Unit tests:
  - `npm run test`
- Coverage:
  - `npm run test:cov`
- Single file example:
  - `npx jest src/modules/auth/use-cases/auth-login.use-case.spec.ts`

### What to Validate in Auth Changes

1. Credential validation and unauthorized paths.
2. Refresh token rotation and hash persistence.
3. Logout invalidates stored refresh token.
4. Controller response envelope shape remains consistent.
5. Use case returns remain business-oriented (no HTTP envelope objects).
