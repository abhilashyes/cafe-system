# brew-mobile-customer

Project Brew **customer mobile app** — a single **Flutter / Dart** codebase for iOS
and Android (§5.1). It is intentionally a **separate repository** and integrates
with the platform **only via the published `brew-contracts` APIs** — there is no
code dependency on the backend monorepo.

> Phase 0: placeholder screens wired to the `/v1` API client (`lib/api/brew_api.dart`).

> **Note on location:** This app is meant to live in its **own repository**
> (`brew-mobile-customer`). It is currently nested here under `apps/` only because
> automated repo creation was blocked by the CI integration's permissions. It has
> **no `package.json`**, so the pnpm/Turborepo workspace ignores it — there is no
> build coupling to the monorepo. Move this folder to a standalone repo when
> permissions allow; nothing in it imports the monorepo (it talks to `/v1` APIs only).

## Features (screens)

Phone+OTP login (Cognito, no password) · store-aware menu + modifiers · cart &
Razorpay checkout (UPI intent / cards / wallets) with GST receipt · pre-order &
dine-in/pickup scheduling · live order tracking + push · loyalty (tier of 5, stars,
rewards) · **Privacy Center** (DPDP: consent, export, erasure) · store locator.

## Integration

All data flows through the documented `/v1` endpoints in `brew-contracts`. The dev
backend (`brew-backend`) accepts a mock token and OTP `000000`.

```dart
final api = BrewApi(baseUrl: 'http://localhost:3000');
await api.startOtp('+919999999999');
await api.verifyOtp('+919999999999', '000000');
final menu = await api.storeMenu('store_1');
```

## Run

```bash
flutter pub get
flutter run            # device/emulator
flutter analyze        # static analysis
flutter test           # widget tests
```

## Security (MASVS-minded)

Secure token storage (Keychain/Keystore), SSL pinning, input validation, and
jailbreak/root awareness are required before release (see the platform threat model).
