import 'package:cyclemind_ai/core/constants/app_constants.dart';
import 'package:cyclemind_ai/features/auth/domain/entities/app_user.dart';

/// Firestore (de)serialisation for [AppUser] — the `users/{userId}` document.
///
/// Kept as a thin mapping layer so the domain entity stays free of any
/// persistence concerns (Clean Architecture boundary).
class UserModel {
  const UserModel._();

  static AppUser fromMap(String id, Map<String, dynamic> map) {
    final profile = (map['profile'] as Map<String, dynamic>?) ?? const {};
    final prefs = (map['preferences'] as Map<String, dynamic>?) ?? const {};
    return AppUser(
      id: id,
      email: map['email'] as String? ?? '',
      profile: UserProfile(
        displayName: profile['displayName'] as String? ?? 'Rider',
        level: RiderLevel.values.firstWhere(
          (l) => l.name == profile['level'],
          orElse: () => RiderLevel.beginner,
        ),
        avatarUrl: profile['avatarUrl'] as String?,
        weightKg: (profile['weightKg'] as num?)?.toDouble(),
      ),
      goals: ((map['goals'] as List?) ?? const [])
          .map((g) => RiderGoal.values.firstWhere(
                (e) => e.name == g,
                orElse: () => RiderGoal.improveEndurance,
              ))
          .toList(),
      preferences: UserPreferences(
        metricUnits: prefs['metricUnits'] as bool? ?? true,
        darkMode: prefs['darkMode'] as bool? ?? true,
        notificationsEnabled: prefs['notificationsEnabled'] as bool? ?? true,
      ),
    );
  }

  static Map<String, dynamic> toMap(AppUser user) => {
        'email': user.email,
        'profile': {
          'displayName': user.profile.displayName,
          'level': user.profile.level.name,
          'avatarUrl': user.profile.avatarUrl,
          'weightKg': user.profile.weightKg,
        },
        'goals': user.goals.map((g) => g.name).toList(),
        'preferences': {
          'metricUnits': user.preferences.metricUnits,
          'darkMode': user.preferences.darkMode,
          'notificationsEnabled': user.preferences.notificationsEnabled,
        },
      };
}
