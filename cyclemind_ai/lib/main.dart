import 'package:cyclemind_ai/app/app.dart';
import 'package:cyclemind_ai/bootstrap.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// App entry point.
///
/// Run on mocks (default):   `flutter run`
/// Run against real backends: `flutter run --dart-define=USE_MOCKS=false \
///     --dart-define=FUNCTIONS_BASE_URL=https://<region>-<project>.cloudfunctions.net`
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await bootstrap();
  runApp(const ProviderScope(child: CycleMindApp()));
}
