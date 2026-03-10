# Full-Stack Code Review

## API Layer
- Are request/response types consistent between frontend and backend?
- Is input validation present on the backend (never trust the client)?
- Are error responses handled gracefully on the frontend?
- Are API calls properly typed (no `any` in fetch responses)?

## Frontend
- Are loading and error states handled for all async operations?
- Is the component tree efficient (no unnecessary re-renders)?
- Are forms validated on both client and server?
- Is user feedback provided for all actions (toasts, loading indicators)?

## Backend
- Are database queries efficient (no N+1, proper indexes)?
- Is authentication/authorization checked on all protected routes?
- Are sensitive data fields excluded from API responses?
- Are database operations wrapped in transactions where needed?

## Security
- No secrets in frontend code or git history
- CORS configured with specific origins
- API rate limiting on sensitive endpoints
- SQL injection prevention (parameterized queries)
- XSS prevention (output encoding, CSP headers)
