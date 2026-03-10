# Backend API Development Guidelines

## API Design
- Use RESTful conventions: proper HTTP methods, status codes, and resource naming.
- Version APIs from the start: `/api/v1/resource`.
- Return consistent response shapes: `{ data, error, meta }`.
- Use plural nouns for resource endpoints: `/users`, `/orders`.
- Support pagination for list endpoints with `limit` and `offset` or cursor-based.

## Database
- Always use parameterized queries or an ORM — never interpolate user input into SQL.
- Write migrations for schema changes — never modify the database manually.
- Add indexes for columns used in WHERE, JOIN, and ORDER BY clauses.
- Use transactions for operations that modify multiple tables.
- Name tables and columns with snake_case.

## Authentication & Authorization
- Use JWTs or session tokens for authentication.
- Validate tokens on every request, not just login.
- Implement role-based access control (RBAC) at the middleware level.
- Never store passwords in plain text — use bcrypt or argon2.
- Rate-limit authentication endpoints.

## Error Handling
- Return appropriate HTTP status codes (400, 401, 403, 404, 500).
- Log errors with context (request ID, user ID, endpoint).
- Don't expose internal error details to clients in production.
- Use a centralized error handler middleware.

## Security
- Validate and sanitize all input at the API boundary.
- Use CORS with specific origins, not `*`.
- Set security headers (Helmet.js for Express, or equivalent).
- Keep dependencies updated — run `npm audit` regularly.

## Logging & Monitoring
- Use structured logging (JSON) with consistent fields.
- Log request/response at the middleware level with timing.
- Include request IDs for tracing across services.
- Set up health check endpoints: `GET /health`.
