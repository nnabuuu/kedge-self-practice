# User Auth Feature Design

## Overview
Provides authentication and role based authorization for the backend. Adds an `admin` role alongside existing `teacher` and `student` roles and restricts privileged routes.

## Components
- **AuthController** – handles user sign-up and sign-in, including a mock admin sign-in available only from localhost for development.
- **AdminGuard** – allows access only to users with the `admin` role. Used to protect user creation endpoints.
- **TeacherGuard** – allows access only to users with the `teacher` role. Applied to GPT and DOCX endpoints that require teacher permissions.
- **JwtModule** – exported to permit controllers to issue JWT tokens, such as the mock admin sign-in endpoint.

## API Restrictions
- `POST /auth/sign-up` – requires authenticated admin user to create new users with any role.
- `POST /auth/mock-admin-sign-in` – returns an admin JWT when the request originates from localhost.
- `POST /gpt/*` and `POST /docx/*` – accessible only to authenticated teachers via `JwtAuthGuard` and `TeacherGuard`.

## Future Work
- Add tests for admin and teacher guards.
- Implement production-safe authentication flow for admin sign-in.
