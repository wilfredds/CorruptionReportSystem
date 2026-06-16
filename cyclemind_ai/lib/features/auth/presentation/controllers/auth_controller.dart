import 'package:cyclemind_ai/core/constants/app_constants.dart';
import 'package:cyclemind_ai/core/providers/firebase_providers.dart';
import 'package:cyclemind_ai/core/utils/result.dart';
import 'package:cyclemind_ai/features/auth/data/repositories/firebase_auth_repository.dart';
import 'package:cyclemind_ai/features/auth/data/repositories/mock_auth_repository.dart';
import 'package:cyclemind_ai/features/auth/domain/entities/app_user.dart';
import 'package:cyclemind_ai/features/auth/domain/repositories/auth_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Binds the [AuthRepository] implementation based on [AppConstants.useMocks].
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  if (AppConstants.useMocks) return MockAuthRepository();
  return FirebaseAuthRepository(
    auth: ref.watch(firebaseAuthProvider),
    firestore: ref.watch(firestoreProvider),
  );
});

/// Streams the current [AppUser]; drives router auth redirects.
final authStateProvider = StreamProvider<AppUser?>((ref) {
  return ref.watch(authRepositoryProvider).authStateChanges();
});

/// Imperative auth actions for the sign-in / sign-up screens.
///
/// Exposes an [AsyncValue<void>] so screens can show loading/error state while
/// delegating the actual work to the repository.
class AuthController extends StateNotifier<AsyncValue<void>> {
  AuthController(this._repo) : super(const AsyncData(null));

  final AuthRepository _repo;

  Future<bool> signIn(String email, String password) =>
      _run(() => _repo.signInWithEmail(email: email, password: password));

  Future<bool> signUp(String email, String password, String name) => _run(
      () => _repo.signUpWithEmail(
          email: email, password: password, displayName: name));

  Future<bool> signInWithGoogle() => _run(_repo.signInWithGoogle);

  Future<void> signOut() => _repo.signOut();

  Future<bool> _run(Future<Result<Object?>> Function() action) async {
    state = const AsyncLoading();
    final result = await action();
    return result.fold(
      (failure) {
        state = AsyncError(failure.message, StackTrace.current);
        return false;
      },
      (_) {
        state = const AsyncData(null);
        return true;
      },
    );
  }
}

final authControllerProvider =
    StateNotifierProvider<AuthController, AsyncValue<void>>((ref) {
  return AuthController(ref.watch(authRepositoryProvider));
});
