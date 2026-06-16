import 'dart:typed_data';

import 'package:cyclemind_ai/core/error/failures.dart';
import 'package:cyclemind_ai/core/utils/result.dart';
import 'package:cyclemind_ai/features/bike_doctor/domain/entities/bike_health_report.dart';
import 'package:cyclemind_ai/features/bike_doctor/domain/repositories/reports_repository.dart';
import 'package:cyclemind_ai/services/vision/vision_service.dart';

/// Orchestrates the Bike Doctor workflow: run vision analysis, then persist the
/// resulting report.
///
/// This use case is the single composition point binding [VisionService] and
/// [ReportsRepository], keeping that orchestration out of the UI layer.
class AnalyzeBikePhoto {
  const AnalyzeBikePhoto(this._vision, this._reports);

  final VisionService _vision;
  final ReportsRepository _reports;

  Future<Result<BikeHealthReport>> call({
    required Uint8List imageBytes,
    required BikePart part,
    required String userId,
    String? bikeId,
  }) async {
    try {
      final report = await _vision.analyzeBikePhoto(
        imageBytes: imageBytes,
        part: part,
        userId: userId,
        bikeId: bikeId,
      );
      await _reports.saveReport(report);
      return Success(report);
    } catch (_) {
      return Failure(const AiFailure('Could not analyse the photo.'));
    }
  }
}
