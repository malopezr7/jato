# Code Review Guidelines

When reviewing code, check for these categories in order of priority:

## 1. Correctness
- Does the code do what it's supposed to do?
- Are edge cases handled? (null/undefined, empty arrays, boundary values)
- Are there potential race conditions or concurrency issues?

## 2. Security
- No hardcoded secrets, API keys, or credentials
- Input validation at system boundaries
- No SQL injection, XSS, or command injection vulnerabilities
- Proper authentication and authorization checks

## 3. Readability
- Are variable and function names descriptive?
- Is the control flow easy to follow?
- Could complex logic be simplified or broken into smaller functions?

## 4. Performance
- No unnecessary iterations or database queries
- No memory leaks (event listeners, timers, subscriptions not cleaned up)
- Appropriate use of caching where beneficial

## 5. Testing
- Are the new/changed behaviors covered by tests?
- Do tests cover edge cases and error paths?
- Are tests independent and deterministic?
