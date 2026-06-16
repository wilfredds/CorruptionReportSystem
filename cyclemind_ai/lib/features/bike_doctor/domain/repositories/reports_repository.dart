import 'package:cyclemind_ai/core/utils/result.dart';
import 'package:cyclemind_ai/features/bike_doctor/domain/entities/bike_health_report.dart';

/// Contract for persisting + retrieving Bike Doctor health reports
/// (`ai_reports` with `type == bikeHealth`).
abstract interface class ReportsRepository {
  Stream<List<BikeHealthReport>> watchReports(String userId);

  Future<Result<BikeHealthReport>> saveReport(BikeHealthReport report);
}
