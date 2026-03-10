# Claude Code — React Native Context

## When working on this React Native project:
- Always check `app.json` / `app.config.js` for Expo configuration before suggesting native changes.
- Use Expo SDK APIs when available instead of bare React Native APIs.
- Run `npx expo start` to test changes, not `react-native run-ios/android`.
- Check platform compatibility of packages before suggesting them.

## Testing
- Use `@testing-library/react-native` for component tests.
- Use `jest.mock()` for native modules that don't work in test environment.
- Test navigation flows with `@react-navigation/native` test utils.

## Common Patterns
- Use `expo-router` for file-based routing if the project uses it.
- Use `expo-secure-store` for sensitive data, `@react-native-async-storage/async-storage` for general persistence.
- Use `expo-image` instead of `Image` for better caching and performance.
