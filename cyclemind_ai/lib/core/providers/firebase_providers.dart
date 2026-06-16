import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Riverpod providers exposing the Firebase singletons.
///
/// These are only *read* by the real (non-mock) data sources. When running on
/// mocks the app never touches them, so an unconfigured Firebase project does
/// not break local development. `main.dart` guards `Firebase.initializeApp`
/// accordingly.
final firebaseAuthProvider =
    Provider<FirebaseAuth>((ref) => FirebaseAuth.instance);

final firestoreProvider =
    Provider<FirebaseFirestore>((ref) => FirebaseFirestore.instance);

final firebaseStorageProvider =
    Provider<FirebaseStorage>((ref) => FirebaseStorage.instance);
