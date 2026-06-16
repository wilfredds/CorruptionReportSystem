import 'package:equatable/equatable.dart';

/// A bicycle owned by the user. Maps to `bikes/{bikeId}`.
///
/// Supports multiple bikes per user. Each tracks a list of [BikeComponent]s and
/// total mileage, which together drive maintenance reminders.
class Bike extends Equatable {
  const Bike({
    required this.id,
    required this.userId,
    required this.name,
    required this.frame,
    required this.groupset,
    required this.tires,
    this.totalMileageKm = 0,
    this.imageUrl,
    this.components = const [],
  });

  final String id;
  final String userId;
  final String name;
  final String frame;
  final String groupset;
  final String tires;
  final double totalMileageKm;
  final String? imageUrl;
  final List<BikeComponent> components;

  Bike copyWith({
    String? id,
    String? userId,
    String? name,
    String? frame,
    String? groupset,
    String? tires,
    double? totalMileageKm,
    String? imageUrl,
    List<BikeComponent>? components,
  }) {
    return Bike(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      frame: frame ?? this.frame,
      groupset: groupset ?? this.groupset,
      tires: tires ?? this.tires,
      totalMileageKm: totalMileageKm ?? this.totalMileageKm,
      imageUrl: imageUrl ?? this.imageUrl,
      components: components ?? this.components,
    );
  }

  @override
  List<Object?> get props => [
        id,
        userId,
        name,
        frame,
        groupset,
        tires,
        totalMileageKm,
        imageUrl,
        components,
      ];
}

/// A wear component with a lifespan, used to compute replacement reminders.
class BikeComponent extends Equatable {
  const BikeComponent({
    required this.id,
    required this.type,
    required this.brand,
    required this.installedAtKm,
    required this.lifespanKm,
  });

  final String id;
  final String type; // e.g. Chain, Cassette, Tires, Brake Pads
  final String brand;
  final double installedAtKm;
  final double lifespanKm;

  /// Distance ridden on this component given the bike's current odometer.
  double usedKm(double bikeTotalKm) =>
      (bikeTotalKm - installedAtKm).clamp(0, double.infinity);

  /// 0.0 (fresh) → 1.0+ (overdue) wear fraction.
  double wearFraction(double bikeTotalKm) =>
      lifespanKm <= 0 ? 0 : usedKm(bikeTotalKm) / lifespanKm;

  BikeComponent copyWith({
    String? id,
    String? type,
    String? brand,
    double? installedAtKm,
    double? lifespanKm,
  }) {
    return BikeComponent(
      id: id ?? this.id,
      type: type ?? this.type,
      brand: brand ?? this.brand,
      installedAtKm: installedAtKm ?? this.installedAtKm,
      lifespanKm: lifespanKm ?? this.lifespanKm,
    );
  }

  @override
  List<Object?> get props => [id, type, brand, installedAtKm, lifespanKm];
}
