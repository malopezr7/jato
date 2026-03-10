# React Native Testing Patterns

## Unit Tests
- Test custom hooks with `@testing-library/react-hooks` or `renderHook`.
- Test utility functions directly — they should be pure when possible.
- Mock navigation with `jest.mock('@react-navigation/native')`.

## Component Tests
- Use `@testing-library/react-native` for rendering and querying.
- Query by `testID`, `text`, or `role` — avoid querying by component type.
- Test user interactions: `fireEvent.press()`, `fireEvent.changeText()`.
- Test loading, success, and error states for async components.

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';

it('submits the form with valid input', async () => {
  const onSubmit = jest.fn();
  const { getByTestId, getByText } = render(<Form onSubmit={onSubmit} />);

  fireEvent.changeText(getByTestId('email-input'), 'user@example.com');
  fireEvent.press(getByText('Submit'));

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({ email: 'user@example.com' });
  });
});
```

## Integration Tests
- Test navigation flows: screen A -> action -> screen B.
- Test data fetching with MSW (Mock Service Worker) for API mocking.
- Test offline behavior and error recovery.

## What NOT to Test
- Don't test third-party library internals.
- Don't test styling (use visual regression tools instead).
- Don't test implementation details — test behavior.
