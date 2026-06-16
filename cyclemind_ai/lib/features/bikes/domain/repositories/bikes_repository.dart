import 'package:cyclemind_ai/core/utils/result.dart';
import 'package:cyclemind_ai/features/bikes/domain/entities/bike.dart';
import 'package:cyclemind_ai/features/bikes/domain/entities/maintenance_log.dart';

/// Contract for bike + maintenance persistence.
abstract interface class BikesRepository {
  Stream<List<Bike>> watchBikes(String userId);

  Future<Result<Bike>> addBike(Bike bike);

  Future<Result<Bike>> updateBike(Bike bike);

  Future<Result<void>> deleteBike(String bikeId);

  Stream<List<MaintenanceLog>> watchLogs(String bikeId);

  Future<Result<MaintenanceLog>> addLog(MaintenanceLog log);
}
