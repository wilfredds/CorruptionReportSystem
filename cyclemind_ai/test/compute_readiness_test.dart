import 'package:cyclemind_ai/core/constants/app_constants.dart';
import 'package:cyclemind_ai/features/coach/domain/entities/ride.dart';
import 'package:cyclemind_ai/features/coach/domain/usecases/compute_readiness.dart';
import 'package:flutter_test/flutter_test.dart';

Ride _ride(double km, double elev, int daysAgo) => Ride(
      id: 'r$daysAgo',
      userId: 'u',
      startedAt: DateTime.now().subtract(Duration(days: daysAgo)),
      distanceKm: km,
      elevationM: elev,
      avgSpeedKmh: 25,
      durationSec: 3600,
      calories: 600,
    );

void main() {
  const usecase = ComputeReadiness();

  test('well-rested rider with no recent load is Ready', () {
    final r = usecase.call(const [], sleepScore: 90, recoveryScore: 90);
    expect(r.state, ReadinessState.ready);
    expect(r.score, greaterThanOrEqualTo(75));
  });

  test('heavy recent load lowers readiness', () {
    final fresh = usecase.call(const [], sleepScore: 70, recoveryScore: 70);
    final loaded = usecase.call(
      [_ride(120, 2000, 0), _ride(100, 1500, 1)],
      sleepScore: 70,
      recoveryScore: 70,
    );
    expect(loaded.score, lessThan(fresh.score));
  });

  test('score is clamped to 0–100 range', () {
    final r = usecase.call(const [], sleepScore: 100, recoveryScore: 100);
    expect(r.score, inInclusiveRange(0, 100));
  });
}
