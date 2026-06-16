import 'dart:math' as math;

/// Pure ride-math helpers.
///
/// The Haversine distance and MET-based calorie model are ported from the
/// existing "Bike Guide PH" GPS recorder (`bike-guide-app/js/recorder.js`) so
/// the Flutter app shares the same field-tested formulas.
class RideMetrics {
  RideMetrics._();

  static const double _earthRadiusM = 6371000;

  /// Great-circle distance in metres between two lat/lng points.
  static double haversineMeters(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    final dLat = _rad(lat2 - lat1);
    final dLon = _rad(lon2 - lon1);
    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(_rad(lat1)) *
            math.cos(_rad(lat2)) *
            math.sin(dLon / 2) *
            math.sin(dLon / 2);
    return _earthRadiusM * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
  }

  /// MET value for cycling at a given average speed (km/h).
  /// Mirrors the bands used by the PWA recorder.
  static double metForSpeed(double speedKmh) {
    if (speedKmh < 16) return 4.0;
    if (speedKmh < 19) return 6.8;
    if (speedKmh < 22) return 8.0;
    if (speedKmh < 25) return 10.0;
    if (speedKmh < 30) return 12.0;
    return 15.8;
  }

  /// Estimated calories: MET × weight(kg) × hours.
  static int estimateCalories({
    required double avgSpeedKmh,
    required double weightKg,
    required int durationSec,
  }) {
    final hours = durationSec / 3600.0;
    return (metForSpeed(avgSpeedKmh) * weightKg * hours).round();
  }

  static double _rad(double deg) => deg * math.pi / 180.0;
}
