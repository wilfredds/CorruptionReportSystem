import 'package:cyclemind_ai/app/router/app_router.dart';
import 'package:cyclemind_ai/app/theme/app_theme.dart';
import 'package:cyclemind_ai/core/constants/app_constants.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Root widget. Wires the router and the Material 3 light/dark themes.
class CycleMindApp extends ConsumerWidget {
  const CycleMindApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(goRouterProvider);
    return MaterialApp.router(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.dark, // dark-first premium feel
      routerConfig: router,
    );
  }
}
