import 'package:cyclemind_ai/core/constants/app_constants.dart';
import 'package:equatable/equatable.dart';

/// An AI-generated training plan tailored to a rider's level and goal.
class TrainingPlan extends Equatable {
  const TrainingPlan({
    required this.id,
    required this.goal,
    required this.level,
    required this.summary,
    required this.weeks,
    required this.createdAt,
  });

  final String id;
  final RiderGoal goal;
  final RiderLevel level;
  final String summary;
  final List<TrainingWeek> weeks;
  final DateTime createdAt;

  @override
  List<Object?> get props => [id, goal, level, summary, weeks, createdAt];
}

class TrainingWeek extends Equatable {
  const TrainingWeek({
    required this.weekNumber,
    required this.focus,
    required this.days,
  });

  final int weekNumber;
  final String focus;
  final List<TrainingDay> days;

  @override
  List<Object?> get props => [weekNumber, focus, days];
}

class TrainingDay extends Equatable {
  const TrainingDay({
    required this.dayLabel,
    required this.title,
    required this.description,
    this.durationMin,
    this.isRest = false,
  });

  final String dayLabel;
  final String title;
  final String description;
  final int? durationMin;
  final bool isRest;

  @override
  List<Object?> get props => [dayLabel, title, description, durationMin, isRest];
}
