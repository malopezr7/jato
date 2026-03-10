# Mobile Code Review Guidelines

When reviewing React Native code, check these mobile-specific concerns:

## Performance
- No unnecessary re-renders: check `useCallback`, `useMemo`, `React.memo` usage
- `FlatList` used for lists (not `ScrollView` + `.map()`)
- No heavy computation on the JS thread — use `InteractionManager` or `requestAnimationFrame`
- Images are properly sized and cached (using `expo-image` or `FastImage`)

## Platform Compatibility
- UI tested on both iOS and Android
- Platform-specific code uses `Platform.select()` or `.ios.tsx`/`.android.tsx` files
- Safe areas handled properly (notch, home indicator, status bar)
- Keyboard handling with `KeyboardAvoidingView` or `react-native-keyboard-aware-scroll-view`

## Navigation
- Navigation params are typed and minimal
- Back button behavior is correct on Android
- Deep links are handled and tested

## Accessibility
- Interactive elements have `accessibilityLabel` and `accessibilityRole`
- Touch targets are at least 44x44 points
- Screen reader flow makes logical sense
