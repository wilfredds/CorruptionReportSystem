import 'package:cyclemind_ai/core/utils/result.dart';
import 'package:cyclemind_ai/features/auth/domain/entities/app_user.dart';

/// Contract for authentication + user-profile persistence.
///
/// The presentation layer depends on this interface only; the concrete
/// implementation (mock or Firebase) is bound in `auth_providers.dart`.
abstract interface class AuthRepository {
  /// Emits the current user (or `null` when signed out) and on every change.
  Stream<AppUser?> authStateChanges();

  /// The currently signed-in user, if any.
  AppUser? get currentUser;

  Future<Result<AppUser>> signInWithEmail({
    required String email,
    required String password,
  });

  Future<Result<AppUser>> signUpWithEmail({
    required String email,
    required String password,
    required String displayName,
  });

  Future<Result<AppUser>> signInWithGoogle();

  Future<Result<AppUser>> updateProfile(AppUser user);

  Future<Result<void>> signOut();
}
