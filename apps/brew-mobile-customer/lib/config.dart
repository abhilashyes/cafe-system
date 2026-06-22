/// App configuration. Override the API base at build time:
///   flutter run --dart-define=BREW_API=http://192.168.1.5:3000
///
/// Defaults to 10.0.2.2 (the Android emulator's alias for the host machine).
/// Use http://localhost:3000 for iOS simulator / web.
const String apiBaseUrl = String.fromEnvironment(
  'BREW_API',
  defaultValue: 'http://10.0.2.2:3000',
);

/// The store this customer is browsing (a real app resolves this from the store
/// locator / saved store). Hard-coded here to the seeded demo store.
const String defaultStoreId = String.fromEnvironment(
  'BREW_STORE',
  defaultValue: 'store_1',
);
