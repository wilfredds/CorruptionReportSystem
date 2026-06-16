import 'package:cyclemind_ai/core/constants/app_constants.dart';
import 'package:equatable/equatable.dart';

/// The authenticated user and their cycling profile.
///
/// Maps to the `users/{userId}` Firestore document. Composed of three value
/// objects ([UserProfile], a goals list, and [UserPreferences]) mirroring the
/// agreed database schema.
class AppUser extends Equatable {
  const AppUser({
    required this.id,
    required this.email,
    required this.profile,
    this.goals = const [],
    this.preferences = const UserPreferences(),
  });

  final String id;
  final String email;
  final UserProfile profile;
  final List<RiderGoal> goals;
  final UserPreferences preferences;

  AppUser copyWith({
    String? id,
    String? email,
    UserProfile? profile,
    List<RiderGoal>? goals,
    UserPreferences? preferences,
  }) {
    return AppUser(
      id: id ?? this.id,
      email: email ?? this.email,
      profile: profile ?? this.profile,
      goals: goals ?? this.goals,
      preferences: preferences ?? this.preferences,
    );
  }

  @override
  List<Object?> get props => [id, email, profile, goals, preferences];
}

class UserProfile extends Equatable {
  const UserProfile({
    required this.displayName,
    this.level = RiderLevel.beginner,
    this.avatarUrl,
    this.weightKg,
  });

  final String displayName;
  final RiderLevel level;
  final String? avatarUrl;
  final double? weightKg;

  UserProfile copyWith({
    String? displayName,
    RiderLevel? level,
    String? avatarUrl,
    double? weightKg,
  }) {
    return UserProfile(
      displayName: displayName ?? this.displayName,
      level: level ?? this.level,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      weightKg: weightKg ?? this.weightKg,
    );
  }

  @override
  List<Object?> get props => [displayName, level, avatarUrl, weightKg];
}

class UserPreferences extends Equatable {
  const UserPreferences({
    this.metricUnits = true,
    this.darkMode = true,
    this.notificationsEnabled = true,
  });

  final bool metricUnits;
  final bool darkMode;
  final bool notificationsEnabled;

  UserPreferences copyWith({
    bool? metricUnits,
    bool? darkMode,
    bool? notificationsEnabled,
  }) {
    return UserPreferences(
      metricUnits: metricUnits ?? this.metricUnits,
      darkMode: darkMode ?? this.darkMode,
      notificationsEnabled:
          notificationsEnabled ?? this.notificationsEnabled,
    );
  }

  @override
  List<Object?> get props => [metricUnits, darkMode, notificationsEnabled];
}
