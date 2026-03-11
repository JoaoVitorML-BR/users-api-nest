# Password Reset Module - AI Context Guide

This document explains how the password reset module is structured, which rules must be preserved, and what patterns should be followed when changing this feature.

## Goal

Provide a secure password recovery flow with two API steps:

1. User requests a reset token via email.
2. User resets password with token + new password.

## Folder Structure

- `dto/reset-password.dto.ts`
  - Input contracts for forgot/reset endpoints.
  - Validation is handled by class-validator decorators.

- `password-reset.controller.ts`
  - HTTP routes:
	 - `POST /auth/password/forgot`
	 - `POST /auth/password/reset`
  - Returns API-standard response wrapper.

- `password-reset.entity.ts`
  - Entity: `reset_password_tokens`
  - Stores token, user relation, and expiration.
  - One active token per user (`userId` unique).

- `password-reset.service.ts`
  - Data access and core token/password operations.
  - Validates token expiration.
  - Resets password and consumes token.

- `use-case/reset-password.use-case.ts`
  - Orchestrates business flow.
  - Handles consistency checks (password confirmation, active user checks, queue enqueue).

## End-to-End Logic

### 1) Forgot Password (`POST /auth/password/forgot`)

1. Validate incoming email (DTO + global ValidationPipe).
2. Find user by email.
3. If user not found or inactive, return generic success behavior (no user enumeration leak).
4. Remove previous reset token for this user.
5. Generate secure token.
6. Save token with short expiration.
7. Enqueue email job in Bull queue (`email`) with:
	- `email`
	- `token`
	- `userName`
	- `type: 'password-reset'`

### 2) Reset Password (`POST /auth/password/reset`)

1. Validate payload (token/newPassword/confirmNewPassword).
2. Ensure `newPassword === confirmNewPassword`.
3. Hash password with bcrypt.
4. Validate token existence and expiration.
5. Update user password.
6. Invalidate refresh token (`updateRefreshToken(..., null)`) to force re-login on all sessions.
7. Consume reset token (single-use behavior).

## Security Rules (Do Not Break)

1. Token must be cryptographically secure.
	- Current pattern: `crypto.randomBytes(...)`
	- Do not revert to `Math.random()`.

2. Token must expire quickly.
	- Current env key: `PASSWORD_RESET_EXPIRES_IN_MINUTES`
	- Current default fallback: 15 minutes.

3. Token is single-use.
	- Always delete token after successful reset.

4. Session invalidation is mandatory.
	- Keep refresh token cleanup after password reset.

5. Forgot endpoint should not reveal account existence.
	- Keep generic response pattern for unknown/inactive emails.

## Email Pattern

Email sending is handled through Bull queue processor and template selection by `type`.

- Queue processor reads `{ email, token, type, userName }`.
- Email service selects template by `type`:
  - `email-confirmation`
  - `password-reset`

If new email types are added, update:

1. Queue payload source.
2. Email processor extraction.
3. Template map in email service.

## Conventions

1. Keep controller thin, use use-case for orchestration.
2. Keep repository/ORM operations in service layer.
3. Keep validation in DTO + use-case business checks.
4. Prefer explicit, short error messages for invalid reset actions.
5. Avoid `console.log` in production flow; use `Logger`.

## Response Contract

All endpoints in this module should follow the global response envelope used by interceptor/filter layers:

- `statusCode`
- `status`
- `code`
- `message`
- `data` (optional)

Guidelines:

1. Keep response-shape responsibility in the controller layer.
2. Keep use-case return values business-oriented (domain result, boolean, or void).
3. Do not build HTTP-style envelopes inside service or repository layers.
4. Errors should still be thrown as exceptions and normalized by the global exception filter.

## Environment Variables

- `PASSWORD_RESET_EXPIRES_IN_MINUTES` (recommended in `.env`)
- `EMAIL_USER`
- `EMAIL_PASS`

## Common Future Improvements

1. Add rate limiting specifically for forgot-password route.
2. Store only hashed reset tokens in DB (instead of plaintext token).
3. Add audit logs/events for password reset lifecycle.
4. Add dedicated tests for:
	- expired token rejection
	- token reuse rejection
	- refresh token invalidation
