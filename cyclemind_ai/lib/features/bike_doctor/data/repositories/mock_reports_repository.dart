import 'dart:async';

import 'package:cyclemind_ai/core/utils/result.dart';
import 'package:cyclemind_ai/features/bike_doctor/domain/entities/bike_health_report.dart';
import 'package:cyclemind_ai/features/bike_doctor/domain/repositories/reports_repository.dart';

/// In-memory [ReportsRepository] (session-scoped) for mock mode.
class MockReportsRepository implements ReportsRepository {
  // Static so reports survive provider rebuilds within a session.
  static final List<BikeHealthReport> _reports = [];
  final _controller = StreamController<List<BikeHealthReport>>.broadcast();

  @override
  Stream<List<BikeHealthReport>> watchReports(String userId) async* {
    yield _sorted();
    yield* _controller.stream;
  }

  @override
  Future<Result<BikeHealthReport>> saveReport(BikeHealthReport report) async {
    _reports.add(report);
    _controller.add(_sorted());
    return Success(report);
  }

  List<BikeHealthReport> _sorted() => [..._reports]
    ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
}
