import 'dart:typed_data';

import 'package:cyclemind_ai/features/bike_doctor/domain/entities/bike_health_report.dart';

/// The bike area a photo is being analysed for. `whole` runs a general scan.
enum BikePart { whole, tires, chain, brakes, frame, drivetrain }

extension BikePartX on BikePart {
  String get label => switch (this) {
        BikePart.whole => 'Whole bike',
        BikePart.tires => 'Tires',
        BikePart.chain => 'Chain',
        BikePart.brakes => 'Brakes',
        BikePart.frame => 'Frame',
        BikePart.drivetrain => 'Drivetrain',
      };
}

/// Abstraction over the computer-vision analysis (the AI Bike Doctor).
///
/// Implemented by [MockVisionService] (offline, deterministic) and
/// [ClaudeVisionService] (production, via a Cloud Function that calls Claude's
/// vision model). UI/use-cases depend only on this interface.
abstract interface class VisionService {
  /// Analyse [imageBytes] for the chosen [part] and return a health report.
  ///
  /// [userId]/[bikeId] are stamped onto the resulting report for persistence.
  Future<BikeHealthReport> analyzeBikePhoto({
    required Uint8List imageBytes,
    required BikePart part,
    required String userId,
    String? bikeId,
  });
}
