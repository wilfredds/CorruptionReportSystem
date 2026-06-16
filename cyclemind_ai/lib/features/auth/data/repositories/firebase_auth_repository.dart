import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cyclemind_ai/core/constants/app_constants.dart';
import 'package:cyclemind_ai/core/error/failures.dart';
import 'package:cyclemind_ai/core/utils/result.dart';
import 'package:cyclemind_ai/features/auth/data/models/user_model.dart';
import 'package:cyclemind_ai/features/auth/domain/entities/app_user.dart';
import 'package:cyclemind_ai/features/auth/domain/repositories/auth_repository.dart';
import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:google_sign_in/google_sign_in.dart';

/// Production [AuthRepository] backed by Firebase Auth + Firestore.
///
/// Auth state is mapped to [AppUser] by loading the matching `users/{uid}`
/// document (creating it on first sign-up). Selected only when
/// `USE_MOCKS=false`.
class FirebaseAuthRepository implements AuthRepository {
  FirebaseAuthRepository({
    required fb.FirebaseAuth auth,
    required FirebaseFirestore firestore,
    GoogleSignIn? googleSignIn,
  })  : _auth = auth,
        _db = firestore,
        _google = googleSignIn ?? GoogleSignIn();

  final fb.FirebaseAuth _auth;
  final FirebaseFirestore _db;
  final GoogleSignIn _google;
  AppUser? _cached;

  DocumentReference<Map<String, dynamic>> _userDoc(String uid) =>
      _db.collection(AppConstants.usersCollection).doc(uid);

  @override
  Stream<AppUser?> authStateChanges() {
    return _auth.authStateChanges().asyncMap((fbUser) async {
      if (fbUser == null) {
        _cached = null;
        return null;
      }
      final snap = await _userDoc(fbUser.uid).get();
      final user = snap.exists
          ? UserModel.fromMap(fbUser.uid, snap.data()!)
          : AppUser(
              id: fbUser.uid,
              email: fbUser.email ?? '',
              profile: UserProfile(displayName: fbUser.displayName ?? 'Rider'),
            );
      _cached = user;
      return user;
    });
  }

  @override
  AppUser? get currentUser => _cached;

  @override
  Future<Result<AppUser>> signInWithEmail({
    required String email,
    required String password,
  }) async {
    try {
      final cred = await _auth.signInWithEmailAndPassword(
          email: email, password: password);
      return Success(await _loadOrCreate(cred.user!));
    } on fb.FirebaseAuthException catch (e) {
      return Failure(AuthFailure(e.message ?? 'Sign-in failed.'));
    } catch (_) {
      return Failure(const ServerFailure());
    }
  }

  @override
  Future<Result<AppUser>> signUpWithEmail({
    required String email,
    required String password,
    required String displayName,
  }) async {
    try {
      final cred = await _auth.createUserWithEmailAndPassword(
          email: email, password: password);
      final user = AppUser(
        id: cred.user!.uid,
        email: email,
        profile: UserProfile(displayName: displayName),
      );
      await _userDoc(user.id).set(UserModel.toMap(user));
      _cached = user;
      return Success(user);
    } on fb.FirebaseAuthException catch (e) {
      return Failure(AuthFailure(e.message ?? 'Sign-up failed.'));
    } catch (_) {
      return Failure(const ServerFailure());
    }
  }

  @override
  Future<Result<AppUser>> signInWithGoogle() async {
    try {
      final account = await _google.signIn();
      if (account == null) return Failure(const AuthFailure('Cancelled.'));
      final gAuth = await account.authentication;
      final cred = fb.GoogleAuthProvider.credential(
        accessToken: gAuth.accessToken,
        idToken: gAuth.idToken,
      );
      final result = await _auth.signInWithCredential(cred);
      return Success(await _loadOrCreate(result.user!));
    } catch (_) {
      return Failure(const AuthFailure('Google sign-in failed.'));
    }
  }

  @override
  Future<Result<AppUser>> updateProfile(AppUser user) async {
    try {
      await _userDoc(user.id).set(UserModel.toMap(user), SetOptions(merge: true));
      _cached = user;
      return Success(user);
    } catch (_) {
      return Failure(const ServerFailure());
    }
  }

  @override
  Future<Result<void>> signOut() async {
    try {
      await Future.wait([_auth.signOut(), _google.signOut()]);
      _cached = null;
      return const Success(null);
    } catch (_) {
      return Failure(const ServerFailure());
    }
  }

  Future<AppUser> _loadOrCreate(fb.User fbUser) async {
    final snap = await _userDoc(fbUser.uid).get();
    if (snap.exists) {
      final user = UserModel.fromMap(fbUser.uid, snap.data()!);
      _cached = user;
      return user;
    }
    final user = AppUser(
      id: fbUser.uid,
      email: fbUser.email ?? '',
      profile: UserProfile(displayName: fbUser.displayName ?? 'Rider'),
    );
    await _userDoc(user.id).set(UserModel.toMap(user));
    _cached = user;
    return user;
  }
}
