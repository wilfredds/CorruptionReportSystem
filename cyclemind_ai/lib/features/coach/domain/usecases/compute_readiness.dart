import 'package:cyclemind_ai/core/constants/app_constants.dart';
import 'package:cyclemind_ai/features/coach/domain/entities/readiness.dart';
import 'package:cyclemind_ai/features/coach/domain/entities/ride.dart';

/// Computes a Whoop/Garmin-style readiness score from recent training load.
///
/// Single-responsibility use case (SOLID): given recent [rides] plus optional
/// sleep/recovery signals, it derives sub-scores and an overall 0–100 readiness
/// with a [ReadinessState]. Sensor inputs are optional; sensible defaults keep
/// it working for riders without a wearable.
class ComputeReadiness {
  const ComputeReadiness();

  Readiness call(
    List<Ride> rides, {
    int sleepScore = 75,
    int recoveryScore = 70,
    DateTime? now,
  }) {
    final today = now ?? DateTime.now();

    // Acute training load over the last 3 days drives fatigue.
    final recent = rides.where(
        (r) => today.difference(r.startedAt).inDays <= 3 && r.startedAt.isBefore(today.add(const Duration(days: 1))));
    final load = recent.fold<double>(
        0, (sum, r) => sum + r.distanceKm + r.elevationM / 100);

    // Higher load → lower fatigue score (more fatigued). Tunable constant.
    final fatigueScore = (100 - (load / 2)).clamp(20, 100).round();

    final score =
        ((sleepScore * 0.35) + (recoveryScore * 0.35) + (fatigueScore * 0.30))
            .round();

    final state = score >= 75
        ? ReadinessState.ready
        : score >= 55
            ? ReadinessState.moderate
            : ReadinessState.recoveryNeeded;

    return Readiness(
      score: score,
      state: state,
      sleepScore: sleepScore,
      recoveryScore: recoveryScore,
      fatigueScore: fatigueScore,
      advice: _defaultAdvice(state),
    );
  }

  String _defaultAdvice(ReadinessState state) => switch (state) {
        ReadinessState.ready => 'Good to push today.',
        ReadinessState.moderate => 'Keep it steady today.',
        ReadinessState.recoveryNeeded => 'Prioritise recovery today.',
      };
}
