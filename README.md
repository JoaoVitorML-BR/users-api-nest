# API-Login

## Setup

- Copy `.env.example` to `.env`
- Ajust `JWT_SECRET`, `JWT_ACCESS_TOKEN_EXPIRES_IN`, `JWT_REFRESH_TOKEN_EXPIRES_IN`
- To protect  `THROTTLE_LIMIT` e `THROTTLE_TTL_MS`

## Auth-user

- Login with rate limit for endpoint
- Refresh token with rotation (new token each refresh)
- Refresh token saved with hash
- Logout remove refresh token persistido persistes