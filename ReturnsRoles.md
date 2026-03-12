# API Response Rules

## General Rule
- **Success (2xx)** → Always returns `data`
- **Error (4xx, 5xx)** → Always returns `data: null`

## Scenarios

| Operation | Status | Returns data? | Example |
|----------|--------|---------------|---------|
| Successful login | 200 | ✅ YES | `{ token, user }` |
| Failed login | 401 | ❌ NO | `data: null` |
| Create user ✅ | 201 | ✅ YES | `{ created user }` |
| Create user ❌ | 409/400 | ❌ NO | `data: null` |
| List users ✅ | 200 | ✅ YES | `[ users ]` |
| List users ❌ | 500 | ❌ NO | `data: null` |
| Update ✅ | 200 | ✅ YES | `{ updated user }` |
| Update ❌ | 404/400 | ❌ NO | `data: null` |
| Delete ✅ | 204 | ❌ NO | `data: null` (no body) |
| Delete ❌ | 404 | ❌ NO | `data: null` |