import 'dart:convert';

import 'package:cyclemind_ai/core/constants/app_constants.dart';
import 'package:cyclemind_ai/services/ai/ai_service.dart';
import 'package:cyclemind_ai/features/coach/domain/entities/readiness.dart';
import 'package:cyclemind_ai/features/coach/domain/entities/ride.dart';
import 'package:cyclemind_ai/features/coach/domain/entities/training_plan.dart';
import 'package:flutter/services.dart' show rootBundle;

/// Offline, deterministic implementation of [AiService].
///
/// It produces realistic coaching output by combining real ride math with
/// cycling tips ported from the existing "Bike Guide PH" dataset
/// (`assets/data/tips.json`). This is the default implementation
/// (`USE_MOCKS=true`) so the app is fully usable with no API keys.
class MockAiService implements AiService {
  List<_Tip>? _tips;

  Future<List<_Tip>> _loadTips() async {
    if (_tips != null) return _tips!;
    try {
      final raw = await rootBundle.loadString(AppConstants.tipsAsset);
      final list = (jsonDecode(raw) as List).cast<Map<String, dynamic>>();
      _tips = list
          .map((m) => _Tip(m['tip'] as String, (m['level'] as String?) ?? 'all'))
          .toList();
    } catch (_) {
      _tips = const [];
    }
    return _tips!;
  }

  Future<List<String>> _tipsFor(RiderLevel level, int count) async {
    final tips = await _loadTips();
    final levelName = level.name;
    final matching = tips
        .where((t) => t.level == 'all' || t.level == levelName)
        .map((t) => t.text)
        .toList();
    matching.shuffle();
    return matching.take(count).toList();
  }

  @override
  Future<CoachInsight> summarizeRide(Ride ride,
      {List<Ride> history = const []}) async {
    await _simulateLatency();
    final bullets = <String>[];

    if (history.isNotEmpty) {
      final avgDist =
          history.map((r) => r.distanceKm).reduce((a, b) => a + b) /
              history.length;
      final delta = ((ride.distanceKm - avgDist) / avgDist * 100);
      bullets.add(delta >= 0
          ? 'This ride was ${delta.abs().toStringAsFixed(0)}% longer than your recent average — great endurance work.'
          : 'This ride was ${delta.abs().toStringAsFixed(0)}% shorter than your average — good for recovery.');
    }

    if (ride.cadence != null && ride.cadence! < 75) {
      bullets.add(
          'Your average cadence (${ride.cadence} rpm) is below the recommended 80–90 rpm range — try spinning a lighter gear.');
    }
    if (ride.elevationM > 600) {
      bullets.add(
          'Strong climbing day: ${ride.elevationM.toStringAsFixed(0)} m of elevation. Fuel well on the descents.');
    }
    bullets.addAll(await _tipsFor(RiderLevel.intermediate, 1));

    return CoachInsight(
      headline:
          'You covered ${ride.distanceKm.toStringAsFixed(1)} km at ${ride.avgSpeedKmh.toStringAsFixed(1)} km/h.',
      bullets: bullets,
    );
  }

  @override
  Future<CoachInsight> weeklyInsight(List<Ride> rides) async {
    await _simulateLatency();
    if (rides.isEmpty) {
      return const CoachInsight(
        headline: 'No rides logged this week yet.',
        bullets: ['Log your first ride to unlock personalised insights.'],
      );
    }
    final totalKm = rides.map((r) => r.distanceKm).reduce((a, b) => a + b);
    final totalElev = rides.map((r) => r.elevationM).reduce((a, b) => a + b);
    final avgSpeed =
        rides.map((r) => r.avgSpeedKmh).reduce((a, b) => a + b) / rides.length;
    return CoachInsight(
      headline:
          '${rides.length} rides · ${totalKm.toStringAsFixed(0)} km · ${totalElev.toStringAsFixed(0)} m climbed',
      bullets: [
        'Your endurance is trending up — average speed held at ${avgSpeed.toStringAsFixed(1)} km/h.',
        if (totalElev > 1500)
          'Big climbing volume this week. Consider one easy spin to absorb the load.'
        else
          'Add one hilly route next week to build climbing strength.',
        ...await _tipsFor(RiderLevel.intermediate, 1),
      ],
    );
  }

  @override
  Future<String> readinessAdvice(Readiness readiness) async {
    await _simulateLatency();
    return switch (readiness.state) {
      ReadinessState.ready =>
        'You\'re primed to train hard today. A tempo or interval session would pay off.',
      ReadinessState.moderate =>
        'Moderate readiness — keep it endurance-paced and listen to your legs.',
      ReadinessState.recoveryNeeded =>
        'Recovery is your best workout today. Prioritise sleep, hydration and an easy spin at most.',
    };
  }

  @override
  Future<TrainingPlan> generateTrainingPlan({
    required RiderLevel level,
    required RiderGoal goal,
  }) async {
    await _simulateLatency();
    final weeks = List.generate(4, (i) {
      final week = i + 1;
      return TrainingWeek(
        weekNumber: week,
        focus: _weekFocus(goal, week),
        days: [
          const TrainingDay(
              dayLabel: 'Mon', title: 'Rest', description: 'Full rest day.', isRest: true),
          TrainingDay(
              dayLabel: 'Tue',
              title: 'Intervals',
              description: '${5 + week}×3 min hard efforts with equal recovery.',
              durationMin: 45 + week * 5),
          TrainingDay(
              dayLabel: 'Wed',
              title: 'Endurance',
              description: 'Zone 2 steady ride, conversational pace.',
              durationMin: 60 + week * 10),
          const TrainingDay(
              dayLabel: 'Thu', title: 'Recovery spin', description: 'Easy 30–40 min.', durationMin: 35),
          TrainingDay(
              dayLabel: 'Fri',
              title: 'Tempo',
              description: 'Sustained tempo blocks just below threshold.',
              durationMin: 50 + week * 5),
          const TrainingDay(
              dayLabel: 'Sat', title: 'Rest', description: 'Optional mobility.', isRest: true),
          TrainingDay(
              dayLabel: 'Sun',
              title: 'Long ride',
              description: 'Progressive long ride — your key session.',
              durationMin: 90 + week * 20),
        ],
      );
    });

    return TrainingPlan(
      id: 'plan-${DateTime.now().millisecondsSinceEpoch}',
      goal: goal,
      level: level,
      summary:
          'A 4-week ${level.label.toLowerCase()} block focused on "${goal.label}". '
          'Volume ramps weekly with a built-in recovery rhythm.',
      weeks: weeks,
      createdAt: DateTime.now(),
    );
  }

  @override
  Future<String> mechanicChat(String message,
      {List<ChatTurn> history = const []}) async {
    await _simulateLatency();
    final lower = message.toLowerCase();
    if (lower.contains('skip') || lower.contains('slip') || lower.contains('gear')) {
      return 'Sounds like a cable-tension or chain-wear issue. A few questions: '
          'Which groupset are you running? Does it skip under load (climbing) or on every gear? '
          'A quarter-turn of the barrel adjuster counter-clockwise often fixes minor skipping.';
    }
    if (lower.contains('brake')) {
      return 'For brake issues I\'d check pad thickness first (replace under 1 mm), then '
          'clean the rotor with isopropyl alcohol. Are the brakes squealing, or feeling spongy?';
    }
    return 'Tell me a bit more — what\'s the symptom, when did it start, and which bike '
        'and groupset? I\'ll walk you through a diagnosis step by step.';
  }

  String _weekFocus(RiderGoal goal, int week) {
    final base = switch (goal) {
      RiderGoal.loseWeight => 'Fat-burning endurance',
      RiderGoal.improveEndurance => 'Aerobic base',
      RiderGoal.prepareRace => 'Race-specific intensity',
      RiderGoal.firstHundredKm => 'Distance build',
    };
    return week == 4 ? '$base + taper' : base;
  }

  Future<void> _simulateLatency() =>
      Future<void>.delayed(const Duration(milliseconds: 400));
}

class _Tip {
  const _Tip(this.text, this.level);
  final String text;
  final String level;
}
