# brew-mobile-customer

Project Brew **customer app** — one **Flutter / Dart** codebase targeting **iOS,
Android, and Web (installable PWA that runs in any browser)** (§5.1). The UI is
**mobile-adaptive** (full-bleed on phones, centered phone-width canvas on
web/desktop). It integrates with the platform **only via the published
`brew-contracts` APIs** — no code dependency on the backend monorepo.

> **Build & deploy to App Store / Play Store / web:** see
> [`BUILD_AND_DEPLOY.md`](./BUILD_AND_DEPLOY.md). Quick web run:
> `flutter create . --platforms=android,ios,web && flutter run -d chrome
> --dart-define=BREW_API=http://localhost:3000`.

> **Status:** working vertical slice — phone+OTP login → store menu → cart →
> place order + UPI checkout → live order tracking → loyalty. Privacy Center and
> store locator are placeholders. (Flutter SDK isn't in the build sandbox, so the
> Dart is written compile-ready but `flutter analyze`/`run` must be done locally.)

> **Note on location:** This app is meant to live in its **own repository**
> (`brew-mobile-customer`). It is currently nested here under `apps/` only because
> automated repo creation was blocked by the CI integration's permissions. It has
> **no `package.json`**, so the pnpm/Turborepo workspace ignores it — there is no
> build coupling to the monorepo. Move this folder to a standalone repo when
> permissions allow; nothing in it imports the monorepo (it talks to `/v1` APIs only).

## Structure

```
lib/
  config.dart          # API base URL + store id (dart-define overridable)
  models.dart          # MenuItem / Order / Loyalty DTOs + money formatting
  api/brew_api.dart    # typed client over the /v1 endpoints
  state/app_state.dart # ChangeNotifier: auth, cart, checkout, loyalty (global)
  main.dart            # MaterialApp + go_router (auth-gated redirect)
  screens/             # login, menu, cart, tracking, loyalty, privacy, stores
```

## Functional flow

Login (phone + OTP) → menu (live store menu, 86 items disabled) → cart (dine-in/
takeaway + table) → **place order** (`POST /v1/orders`) → **UPI payment**
(`POST /v1/payments`, shows the returned UPI intent) → **live tracking** (polls
`GET /v1/orders/:id`) → **loyalty** (`GET /v1/loyalty/accounts/:id`, tier of 5 +
progress). All data flows through the published `/v1` APIs — no backend internals.

## Run

```bash
# point the app at your backend (Android emulator host = 10.0.2.2):
flutter pub get
flutter run --dart-define=BREW_API=http://10.0.2.2:3000   # iOS sim/web: http://localhost:3000
flutter analyze
flutter test
```

Dev auth: any phone, OTP **`000000`** (mock Cognito). Start the backend first
(`pnpm --filter brew-backend start:dev`).

## Security (MASVS-minded)

Secure token storage (Keychain/Keystore), SSL pinning, input validation, and
jailbreak/root awareness are required before release (see the platform threat model).
