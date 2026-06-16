import 'package:cyclemind_ai/core/constants/app_constants.dart';
import 'package:cyclemind_ai/features/coach/domain/entities/readiness.dart';
import 'package:cyclemind_ai/features/coach/domain/entities/ride.dart';
import 'package:cyclemind_ai/features/coach/domain/entities/training_plan.dart';

/// Abstraction over the text-generation AI (the AI Cycling Coach + Mechanic
/// chat).
///
/// Architectural decision (Dependency Inversion): the domain/use-case layer
/// depends only on this interface, never on Claude, HTTP, or Firebase. That
/// lets us swap [MockAiService] (default, offline) for [ClaudeAiService]
/// (production, server-proxied) without touching any feature code.
abstract interface class AiService {
  /// Narrative coaching summary for a freshly completed ride.
  Future<CoachInsight> summarizeRide(Ride ride, {List<Ride> history = const []});

  /// Weekly performance trend insight across recent [rides].
  Future<CoachInsight> weeklyInsight(List<Ride> rides);

  /// Plain-language advice for the given [readiness] inputs.
  Future<String> readinessAdvice(Readiness readiness);

  /// Build a structured training plan for a [level]/[goal] combination.
  Future<TrainingPlan> generateTrainingPlan({
    required RiderLevel level,
    required RiderGoal goal,
  });

  /// AI Bike Mechanic chat turn. [history] is prior turns (oldest first).
  Future<String> mechanicChat(String message, {List<ChatTurn> history = const []});
}

/// One message in the mechanic chat transcript.
class ChatTurn {
  const ChatTurn({required this.role, required this.text});

  /// `user` or `assistant`.
  final String role;
  final String text;

  bool get isUser => role == 'user';
}
