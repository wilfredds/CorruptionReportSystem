import 'package:equatable/equatable.dart';

/// Status of a tracked component relative to its service interval.
enum MaintenanceStatus { ok, dueSoon, overdue }

extension MaintenanceStatusX on MaintenanceStatus {
  String get label => switch (this) {
        MaintenanceStatus.ok => 'OK',
        MaintenanceStatus.dueSoon => 'Due soon',
        MaintenanceStatus.overdue => 'Overdue',
      };
}

/// A service-history entry. Maps to `maintenance_logs/{logId}`.
class MaintenanceLog extends Equatable {
  const MaintenanceLog({
    required this.id,
    required this.userId,
    required this.bikeId,
    required this.component,
    required this.mileageAtService,
    required this.status,
    required this.serviceDate,
    this.notes = '',
  });

  final String id;
  final String userId;
  final String bikeId;
  final String component;
  final double mileageAtService;
  final MaintenanceStatus status;
  final DateTime serviceDate;
  final String notes;

  MaintenanceLog copyWith({
    String? id,
    String? userId,
    String? bikeId,
    String? component,
    double? mileageAtService,
    MaintenanceStatus? status,
    DateTime? serviceDate,
    String? notes,
  }) {
    return MaintenanceLog(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      bikeId: bikeId ?? this.bikeId,
      component: component ?? this.component,
      mileageAtService: mileageAtService ?? this.mileageAtService,
      status: status ?? this.status,
      serviceDate: serviceDate ?? this.serviceDate,
      notes: notes ?? this.notes,
    );
  }

  @override
  List<Object?> get props => [
        id,
        userId,
        bikeId,
        component,
        mileageAtService,
        status,
        serviceDate,
        notes,
      ];
}
