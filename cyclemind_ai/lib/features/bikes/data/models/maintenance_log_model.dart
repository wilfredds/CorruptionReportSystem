import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cyclemind_ai/features/bikes/domain/entities/maintenance_log.dart';

/// Firestore mapping for [MaintenanceLog] — `maintenance_logs/{logId}`.
class MaintenanceLogModel {
  const MaintenanceLogModel._();

  static MaintenanceLog fromMap(String id, Map<String, dynamic> map) {
    return MaintenanceLog(
      id: id,
      userId: map['userId'] as String? ?? '',
      bikeId: map['bikeId'] as String? ?? '',
      component: map['component'] as String? ?? '',
      mileageAtService: (map['mileageAtService'] as num?)?.toDouble() ?? 0,
      status: MaintenanceStatus.values.firstWhere(
        (s) => s.name == map['status'],
        orElse: () => MaintenanceStatus.ok,
      ),
      serviceDate:
          (map['serviceDate'] as Timestamp?)?.toDate() ?? DateTime.now(),
      notes: map['notes'] as String? ?? '',
    );
  }

  static Map<String, dynamic> toMap(MaintenanceLog log) => {
        'userId': log.userId,
        'bikeId': log.bikeId,
        'component': log.component,
        'mileageAtService': log.mileageAtService,
        'status': log.status.name,
        'serviceDate': Timestamp.fromDate(log.serviceDate),
        'notes': log.notes,
      };
}
