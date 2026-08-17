# CycleMind AI — working notes

An AI cycling companion pairing an **AI Cycling Coach** with an **AI Bike
Doctor** in one Flutter app.

**Stack:** Flutter · Dart · Material 3 · Riverpod · Firebase (Auth, Firestore,
Storage, Cloud Functions) · Claude API behind Cloud Functions

## ⚠️ Cannot be built or tested in this environment

**There is no Flutter or Dart SDK installed here.** `flutter`, `dart`,
`flutter test` and `flutter analyze` are all unavailable, and the SessionStart
hook deliberately does not try to install them.

Consequences when working on this project from a remote session:

- You can read and edit Dart source, but **you cannot verify it**.
- Do not claim a change compiles, analyses cleanly, or passes tests. Say
  explicitly that it is unverified and name what needs running.
- The checks that would catch mistakes are `flutter analyze` and `flutter test`
  — call them out for the user to run locally.

CI does build it: `.github/workflows/deploy-web.yml` builds the web app in mock
mode and publishes to GitHub Pages.

Locally, per the README:

```bash
flutter create .
flutter pub get
flutter run          # runs on mock data, no API keys required
flutter test
flutter analyze
```

## Architecture

Clean Architecture, feature-first layout, Repository pattern. The decisions
that matter:

1. **Every external dependency sits behind an interface.** Auth, Firestore,
   Storage, Claude text and Claude vision are each reached through a Dart
   `abstract interface class`. Mock vs. real is chosen in exactly one place per
   dependency, by a Riverpod provider reading `AppConstants.useMocks`. This is
   what lets the whole app run offline with zero configuration — preserve it.
2. **The Claude API key never ships in the app.** Real AI and vision calls go
   through Cloud Functions (`functions/src/index.ts`) which hold the key. Never
   move a key into Dart source or into `firebase_options.dart`.

## Layout

- `lib/features/` — `auth`, `coach`, `bike_doctor`, `bikes`, `dashboard`,
  `profile`
- `lib/core/` — `constants`, `error`, `providers`, `utils`, `widgets`
- `lib/services/` · `lib/app/` · `lib/bootstrap.dart` · `lib/main.dart`
- `functions/` — Cloud Functions (TypeScript), holds the Claude key
- `test/` — `compute_readiness_test.dart`, `generate_reminders_test.dart`,
  `result_test.dart`, `ride_metrics_test.dart`
- `firestore.rules`, `storage.rules`, `firestore.indexes.json`

## Note on the design skills

`.claude/skills/ui-ux-pro-max` has thin Flutter coverage — `--stack flutter`
queries frequently return no match. The skill is built to say so rather than
invent an answer; if it reports no database match, treat its output as general
advice rather than stack-specific guidance.
