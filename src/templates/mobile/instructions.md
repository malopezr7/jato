# React Native / Expo Development Guidelines

## Project Structure
- Use feature-based folder structure: `src/features/<feature>/` with components, hooks, and utils per feature.
- Shared components go in `src/components/`, hooks in `src/hooks/`, utils in `src/utils/`.
- Navigation configuration lives in `src/navigation/`.
- Keep screen components thin — extract business logic to hooks.

## Components
- Use functional components with hooks exclusively.
- Prefer `StyleSheet.create()` over inline styles for performance.
- Extract reusable styles to shared theme constants.
- Use `React.memo()` for list item components and expensive renders.
- Always provide a `key` prop for lists — use a stable ID, never the array index.

## State Management
- Use React Context for app-wide state (auth, theme, user preferences).
- Use `useState`/`useReducer` for component-local state.
- Use React Query or SWR for server state — don't reinvent caching.
- Avoid prop drilling beyond 2 levels — use context or composition.

## Navigation
- Use React Navigation's typed routes.
- Keep navigation params minimal — pass IDs, not full objects.
- Handle deep linking configuration in a centralized file.

## Platform Considerations
- Test on both iOS and Android simulators.
- Use `Platform.select()` for platform-specific values.
- Handle safe areas with `SafeAreaView` or `useSafeAreaInsets()`.
- Support both light and dark mode from the start.

## Performance
- Use `FlatList` for long lists, never `ScrollView` with `.map()`.
- Avoid anonymous functions in `renderItem` — extract to a named component.
- Use `useCallback` for callbacks passed to child components.
- Profile with React DevTools and Flipper when performance issues arise.
