# Authentication Updates

> [!NOTE]
> We moved our authentication system to TypeScript. This guide explains what changed and how to use the new API.

## 🚀 What's New
*   **Better Security**: We now use strict types and two tokens (Access + Refresh) to keep users safe.
*   **Standard Errors**: Errors now look the same everywhere, making them easier to handle.

## ⚠️ Important Changes

### 1. New Login Response
When you log in, you now get two tokens (`accessToken`, `refreshToken`) and your user details.
*   **accessToken**: Use this for API requests. Expires quickly (15 mins).
*   **refreshToken**: Use this to get a new accessToken when the old one expires. Expires in 7 days.

### 2. Update Your Secrets
We renamed the secret key in the `.env` file.
*   **Old Name**: `SECRET`
*   **New Name**: `JWT_SECRET`
    > [!TIP]
    > Make sure to update your `.env` file!

## 📚 API Guide

### 1. Register (Create Account)
**`POST /auth/register`**

```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "...",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

### 2. Login
**`POST /auth/login`**

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "securepassword123"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "admin": false,
    "accountStatus": "active"
  }
}
```

### 3. Refresh Token (Get New Access Token)
**`POST /auth/refresh`**

```bash
curl -X POST http://localhost:4000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOi... (new)",
  "refreshToken": "eyJhbGciOi... (same or rotated)"
}
```

### 4. Authenticated Request Example
Use the `accessToken` to check the API status.

**`POST /graphql`**

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "query": "query { status hello }"
  }'
```

**Response:**
```json
{
    "data": {
        "status": "Active",
        "hello": "Hello from TypeScript Backend! 🚀"
    }
}
```

## 🛠️ Quick Tips for Frontend

1.  **Save Tokens**:
    *   Save `accessToken` in memory (variable).
    *   Save `refreshToken` in a secure cookie or storage.
2.  **Use Tokens**: Add `Authorization: Bearer <accessToken>` to your headers when making requests.
3.  **Handle Expiry**: If you get a `401 Unauthorized` error, use the `/auth/refresh` endpoint to get a new token and try again.
