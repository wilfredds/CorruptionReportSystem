import 'package:cyclemind_ai/core/constants/app_constants.dart';
import 'package:equatable/equatable.dart';

/// The result of a Bike Doctor scan. Persisted to `ai_reports/{reportId}` with
/// `type == bikeHealth`.
///
/// Produced by the vision pipeline: an uploaded photo is analysed and turned
/// into an overall [healthScore] (0–100), a [riskLevel], and a list of
/// per-component [findings] with concrete maintenance suggestions.
class BikeHealthReport extends Equatable {
  const BikeHealthReport({
    required this.id,
    required this.userId,
    required this.healthScore,
    required this.riskLevel,
    required this.findings,
    required this.createdAt,
    this.bikeId,
    this.imageUrl,
    this.summary = '',
  });

  final String id;
  final String userId;
  final String? bikeId;
  final String? imageUrl;
  final int healthScore; // 0–100
  final RiskLevel riskLevel;
  final List<BikeFinding> findings;
  final String summary;
  final DateTime createdAt;

  @override
  List<Object?> get props => [
        id,
        userId,
        bikeId,
        imageUrl,
        healthScore,
        riskLevel,
        findings,
        summary,
        createdAt,
      ];
}

/// A single detected issue for one bike area (tires, chain, brakes, frame…).
class BikeFinding extends Equatable {
  const BikeFinding({
    required this.area,
    required this.issue,
    required this.severity,
    required this.suggestions,
  });

  final String area; // Tires, Chain, Brakes, Frame, Drivetrain
  final String issue;
  final RiskLevel severity;
  final List<String> suggestions;

  @override
  List<Object?> get props => [area, issue, severity, suggestions];
}
