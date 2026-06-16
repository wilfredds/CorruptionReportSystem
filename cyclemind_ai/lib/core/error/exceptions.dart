/// Low-level exceptions thrown by data sources.
///
/// These never cross the repository boundary: repository implementations catch
/// them and translate into [AppFailure]s (see `core/error/failures.dart`).
library;

class ServerException implements Exception {
  ServerException([this.message = 'Server error']);
  final String message;
  @override
  String toString() => 'ServerException: $message';
}

class AuthException implements Exception {
  AuthException([this.message = 'Auth error']);
  final String message;
  @override
  String toString() => 'AuthException: $message';
}

class CacheException implements Exception {
  CacheException([this.message = 'Cache error']);
  final String message;
  @override
  String toString() => 'CacheException: $message';
}

class AiException implements Exception {
  AiException([this.message = 'AI error']);
  final String message;
  @override
  String toString() => 'AiException: $message';
}
