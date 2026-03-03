# API-Login

## Setup

- Copy `.env.example` to `.env`
- Ajust `JWT_SECRET`, `JWT_ACCESS_TOKEN_EXPIRES_IN`, `JWT_REFRESH_TOKEN_EXPIRES_IN`
- To protect  `THROTTLE_LIMIT` e `THROTTLE_TTL_MS`

## Auth-user

- Login com rate limit por endpoint
- Refresh token com rotação (novo token a cada refresh)
- Refresh token salvo com hash no banco
- Logout remove refresh token persistido