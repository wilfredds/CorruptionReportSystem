import 'package:flutter/material.dart';

/// Brand palette for CycleMind AI.
///
/// A cycling-focused, energetic scheme: electric lime as the seed (speed /
/// performance), deep slate surfaces for a premium dark-first feel.
class AppColors {
  AppColors._();

  static const Color brand = Color(0xFF00E676); // electric lime-green
  static const Color brandDark = Color(0xFF00B25B);
  static const Color accent = Color(0xFF18FFFF); // cyan accent
  static const Color danger = Color(0xFFFF5252);
  static const Color warning = Color(0xFFFFB300);
  static const Color success = Color(0xFF00E676);

  // Dark surfaces.
  static const Color darkBg = Color(0xFF0E1116);
  static const Color darkSurface = Color(0xFF161B22);
  static const Color darkSurfaceAlt = Color(0xFF1F2630);
}
