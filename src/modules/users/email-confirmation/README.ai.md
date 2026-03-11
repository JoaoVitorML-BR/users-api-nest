# Email Confirmation Module - AI Context Guide

This document explains the structure and expected behavior of the email confirmation submodule.

## Goal

Enable account activation with token-based email confirmation:

1. Generate and persist activation token tied to user.
2. Dispatch token email through queue processor.
3. Activate account using valid token.

## Folder Structure

- `email-confirmation.controller.ts`
  - Routes under `/email-confirmation`.
  - Responsible for HTTP response envelope formatting.

- `email-confirmation.service.ts`
  - Persistence and activation state transitions.

- `use-cases/send-token.use-case.ts`
  - Generates token, saves token, enqueues email job.

- `use-cases/activate-account.use-case.ts`
  - Validates input and triggers account activation.

- `email.processor.ts`
  - Queue consumer that dispatches email via email service.

## End-to-End Logic

### 1) Send token flow

1. Validate email input.
2. Generate secure token.
3. Persist token with expiration.
4. Enqueue email job on `email` queue.

### 2) Activate account flow (`PATCH /email-confirmation/activate-account`)

1. Validate token presence.
2. Resolve token with related user.
3. Reject invalid or expired token.
4. Mark user as active + email confirmed.
5. Delete consumed confirmation token.

## Security and Consistency Rules

1. Token must expire.
2. Expired token must be removed.
3. Activation token should be single-use.
4. Account activation must set both:
   - `isActive = true`
   - `emailConfirmed = true`
5. Controller must own HTTP envelope formatting.

## Response Contract

Controller returns:

- `statusCode`
- `status`
- `code`
- `message`
- `data` (optional)

Use cases should return business values only.

## Current Routes and Returns

| Endpoint | Success Status | Success `data` behavior | Common error status |
|---|---|---|---|
| `PATCH /email-confirmation/activate-account` | `200` | `data: null` | `400` |
| `POST /email-confirmation/send-email` | `200` | `data: null` | `400` |

## Testing Guide

### Key Test Files

- `email-confirmation.controller.spec.ts`
- `email-confirmation.service.spec.ts`
- `use-cases/activate-account.use-case.spec.ts`
- `use-cases/send-token.use-case.spec.ts`

### Commands

- Unit tests:
  - `npm run test`
- Single file example:
  - `npx jest src/modules/users/email-confirmation/use-cases/send-token.use-case.spec.ts`

### What to Validate in Changes

1. Token generation + persistence.
2. Queue enqueue behavior.
3. Activation success path updates user state.
4. Invalid/expired token paths throw expected exceptions.
5. Controller envelope stays consistent.
