import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cyclemind_ai/core/constants/app_constants.dart';
import 'package:cyclemind_ai/core/error/failures.dart';
import 'package:cyclemind_ai/core/utils/result.dart';
import 'package:cyclemind_ai/features/bike_doctor/data/models/report_model.dart';
import 'package:cyclemind_ai/features/bike_doctor/domain/entities/bike_health_report.dart';
import 'package:cyclemind_ai/features/bike_doctor/domain/repositories/reports_repository.dart';

/// Firestore-backed [ReportsRepository] over the `ai_reports` collection.
class FirebaseReportsRepository implements ReportsRepository {
  FirebaseReportsRepository(this._db);
  final FirebaseFirestore _db;

  CollectionReference<Map<String, dynamic>> get _col =>
      _db.collection(AppConstants.aiReportsCollection);

  @override
  Stream<List<BikeHealthReport>> watchReports(String userId) {
    return _col
        .where('userId', isEqualTo: userId)
        .where('type', isEqualTo: AiReportType.bikeHealth.name)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snap) =>
            snap.docs.map((d) => ReportModel.fromMap(d.id, d.data())).toList());
  }

  @override
  Future<Result<BikeHealthReport>> saveReport(BikeHealthReport report) async {
    try {
      await _col.add(ReportModel.toMap(report));
      return Success(report);
    } catch (_) {
      return Failure(const ServerFailure());
    }
  }
}
