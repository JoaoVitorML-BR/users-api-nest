# API Login

NestJS API for JWT authentication, user management, email confirmation, and password recovery.

## Stack

- NestJS 11
- TypeORM
- MySQL
- Bull + Redis
- Swagger OpenAPI

## Main Flows

- Login with username or email and endpoint throttling
- Refresh token rotation with hashed token persistence
- Logout with invalidation of the persisted refresh token
- Public user registration
- Role-protected admin user creation
- Email confirmation
- Password recovery and reset

## Running the Project

1. Install dependencies:

```bash
npm install
```

2. Copy the environment example file:

```bash
cp .env.example .env
```

On Windows PowerShell, you can use:

```powershell
Copy-Item .env.example .env
```

3. Configure the required environment variables in `.env`:

- `DB_HOST`
- `DB_PORT`
- `PORT`
- `NODE_ENV`
- `JWT_SECRET`
- `JWT_ACCESS_TOKEN_EXPIRES_IN`
- `JWT_REFRESH_TOKEN_EXPIRES_IN`
- `THROTTLE_LIMIT`
- `THROTTLE_TTL_MS`
- `EMAIL_CONFIRMATION_EXPIRES_IN_HOURS`
- `EMAIL_USER`
- `EMAIL_PASS`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_DATABASE`
- `DB_SYNCHRONIZE`

4. Configure email delivery for Gmail.

This project sends email using Gmail through `EMAIL_USER` and `EMAIL_PASS` in [.env.example](.env.example).

- Set `EMAIL_USER` to your Gmail address.
- Generate an App Password in your Google account.
- Copy the generated password exactly as provided by Google into `EMAIL_PASS`.
- Do not replace it with your regular Gmail password.

Google App Password page:

- `https://myaccount.google.com/apppasswords`

5. Make sure MySQL and Redis are available locally.

6. Start the API:

```bash
npm run start:dev
```

## Swagger

With the application running, interactive API documentation is available at:

- `http://localhost:1952/docs`

If the port is configured through `PORT`, replace `1952` with that value.

### Swagger Authentication

Protected endpoints use a JWT bearer token. After login:

1. Copy the `accessToken` returned by `POST /auth/login`.
2. Click `Authorize` in the Swagger UI.
3. Enter the token as a bearer token.

## Default API Response

All endpoints follow the same envelope:

```json
{
	"statusCode": 200,
	"status": true,
	"code": "SUCCESS",
	"message": "Request successful",
	"data": {},
	"meta": {}
}
```

- `data` can be an object, array, or `null`
- `meta` is returned for paginated endpoints

## Endpoints

### Health

- `GET /health` checks basic API availability

### Auth

- `POST /auth/login` authenticates a user and returns `accessToken` and `refreshToken`
- `POST /auth/refresh` rotates the refresh token and returns a new token pair
- `POST /auth/logout` invalidates the persisted refresh token for the authenticated user

### Password Reset

- `POST /auth/password/forgot` starts the recovery flow
- `POST /auth/password/reset` resets the password with a valid token

### Users

- `GET /users` lists users with pagination
- `POST /users` creates a public user
- `POST /users/create-admin` creates an administrator with `ADMIN_MASTER` role protection
- `PATCH /users/:id` updates name and username
- `PATCH /users/password/:id` updates the authenticated user's own password
- `GET /users/:id` gets a user by id
- `GET /users/email/:email` gets a user by email with role-based access rules
- `GET /users/username/:username` gets a public user by username

### Email Confirmation

- `PATCH /email-confirmation/activate-account` activates an account via token
- `POST /email-confirmation/send-email` resends the confirmation email

## Useful Scripts

```bash
npm run start:dev
npm run build
npm run test
npm run test:e2e
npm run lint
```

Developer: João Vitor
LinkedIn: https://www.linkedin.com/in/jo%C3%A3o-vitorml-br/