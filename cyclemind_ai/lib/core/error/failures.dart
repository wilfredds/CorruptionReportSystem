import 'package:equatable/equatable.dart';

/// Base class for all domain-level failures.
///
/// Failures are *expected* error states surfaced to the UI (vs. [Exception]s
/// which are thrown at the data layer and converted into failures by the
/// repository implementations). Keeping a sealed-style hierarchy lets the
/// presentation layer switch on failure type to show tailored messages.
sealed class AppFailure extends Equatable {
  const AppFailure(this.message);

  /// Human-readable, user-safe message.
  final String message;

  @override
  List<Object?> get props => [message];
}

/// Network / connectivity problem.
class NetworkFailure extends AppFailure {
  const NetworkFailure([super.message = 'No internet connection.']);
}

/// Backend (Firestore / Functions) returned an error.
class ServerFailure extends AppFailure {
  const ServerFailure([super.message = 'Something went wrong on the server.']);
}

/// Authentication problem (bad credentials, expired session, etc.).
class AuthFailure extends AppFailure {
  const AuthFailure([super.message = 'Authentication failed.']);
}

/// The AI / vision service could not produce a result.
class AiFailure extends AppFailure {
  const AiFailure([super.message = 'The AI service is unavailable.']);
}

/// Local cache / storage problem.
class CacheFailure extends AppFailure {
  const CacheFailure([super.message = 'Local data error.']);
}

/// Input validation failure.
class ValidationFailure extends AppFailure {
  const ValidationFailure(super.message);
}

/// Catch-all for unexpected errors.
class UnexpectedFailure extends AppFailure {
  const UnexpectedFailure([super.message = 'An unexpected error occurred.']);
}
