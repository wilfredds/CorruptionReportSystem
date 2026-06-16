import 'package:cyclemind_ai/core/constants/app_constants.dart';
import 'package:equatable/equatable.dart';

/// A Whoop/Garmin-style readiness score (0–100) with its contributing factors.
class Readiness extends Equatable {
  const Readiness({
    required this.score,
    required this.state,
    required this.sleepScore,
    required this.recoveryScore,
    required this.fatigueScore,
    required this.advice,
  });

  final int score; // 0–100
  final ReadinessState state;
  final int sleepScore;
  final int recoveryScore;
  final int fatigueScore;
  final String advice;

  @override
  List<Object?> get props =>
      [score, state, sleepScore, recoveryScore, fatigueScore, advice];
}

/// An AI-generated narrative summary + actionable insights for a ride or week.
class CoachInsight extends Equatable {
  const CoachInsight({
    required this.headline,
    required this.bullets,
  });

  final String headline;
  final List<String> bullets;

  @override
  List<Object?> get props => [headline, bullets];
}
