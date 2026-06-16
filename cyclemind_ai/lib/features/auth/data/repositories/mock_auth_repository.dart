import 'dart:async';

import 'package:cyclemind_ai/core/error/failures.dart';
import 'package:cyclemind_ai/core/providers/mock_store.dart';
import 'package:cyclemind_ai/core/utils/result.dart';
import 'package:cyclemind_ai/features/auth/domain/entities/app_user.dart';
import 'package:cyclemind_ai/features/auth/domain/repositories/auth_repository.dart';

/// In-memory [AuthRepository] used when `USE_MOCKS=true`.
///
/// Accepts any credentials and returns the seeded demo user, so reviewers can
/// explore the whole app without a backend. Profile edits mutate the shared
/// [MockStore].
class MockAuthRepository implements AuthRepository {
  final _controller = StreamController<AppUser?>.broadcast();
  AppUser? _current;

  @override
  Stream<AppUser?> authStateChanges() async* {
    yield _current;
    yield* _controller.stream;
  }

  @override
  AppUser? get currentUser => _current;

  @override
  Future<Result<AppUser>> signInWithEmail({
    required String email,
    required String password,
  }) async {
    return _completeSignIn();
  }

  @override
  Future<Result<AppUser>> signUpWithEmail({
    required String email,
    required String password,
    required String displayName,
  }) async {
    await MockStore.instance.ensureLoaded();
    final user = MockStore.instance.user.copyWith(
      email: email,
      profile: MockStore.instance.user.profile.copyWith(displayName: displayName),
    );
    MockStore.instance.user = user;
    _current = user;
    _controller.add(user);
    return Success(user);
  }

  @override
  Future<Result<AppUser>> signInWithGoogle() => _completeSignIn();

  @override
  Future<Result<AppUser>> updateProfile(AppUser user) async {
    MockStore.instance.user = user;
    _current = user;
    _controller.add(user);
    return Success(user);
  }

  @override
  Future<Result<void>> signOut() async {
    _current = null;
    _controller.add(null);
    return const Success(null);
  }

  Future<Result<AppUser>> _completeSignIn() async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    try {
      await MockStore.instance.ensureLoaded();
      _current = MockStore.instance.user;
      _controller.add(_current);
      return Success(_current!);
    } catch (_) {
      return Failure(const AuthFailure());
    }
  }
}
