import 'package:cyclemind_ai/core/utils/ride_metrics.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('RideMetrics', () {
    test('haversine returns ~0 for identical points', () {
      expect(RideMetrics.haversineMeters(14.5, 121.0, 14.5, 121.0),
          closeTo(0, 0.001));
    });

    test('haversine measures a known ~1.11km north step', () {
      // 0.01 degrees of latitude ≈ 1.11 km.
      final d = RideMetrics.haversineMeters(0, 0, 0.01, 0);
      expect(d, closeTo(1112, 5));
    });

    test('MET increases with speed', () {
      expect(RideMetrics.metForSpeed(10), lessThan(RideMetrics.metForSpeed(35)));
    });

    test('calorie estimate scales with duration', () {
      final oneHour = RideMetrics.estimateCalories(
          avgSpeedKmh: 25, weightKg: 70, durationSec: 3600);
      final twoHours = RideMetrics.estimateCalories(
          avgSpeedKmh: 25, weightKg: 70, durationSec: 7200);
      expect(twoHours, closeTo(oneHour * 2, 1));
    });
  });
}
