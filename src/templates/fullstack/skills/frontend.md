# Frontend Development Patterns

## Component Structure
```
src/
  components/          # Shared, reusable components
    Button/
      Button.tsx
      Button.test.tsx
  features/            # Feature-specific modules
    auth/
      LoginForm.tsx
      useAuth.ts
    dashboard/
      Dashboard.tsx
      DashboardStats.tsx
  hooks/               # Shared custom hooks
  utils/               # Pure utility functions
  services/            # API client and external service integrations
```

## Data Fetching
- Use React Query / SWR for server state management.
- Define API functions in a `services/` directory.
- Handle loading, error, and empty states for every query.

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['users', filters],
  queryFn: () => api.getUsers(filters),
});
```

## Forms
- Use a form library (React Hook Form, Formik) for complex forms.
- Validate with Zod schemas shared with the backend when possible.
- Show inline validation errors, not just alerts.
- Disable submit button while submitting.

## State Management
- Server state: React Query / SWR (don't duplicate in Redux/Context).
- UI state: `useState` for component-local, Context for cross-component.
- URL state: Use router query params for filterable/shareable state.

## Performance
- Lazy load routes and heavy components with `React.lazy()` + `Suspense`.
- Optimize images: use `next/image`, `srcset`, or CDN transforms.
- Debounce search inputs and filter changes.
- Virtualize long lists with `react-window` or `@tanstack/virtual`.
