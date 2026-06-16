import 'package:cyclemind_ai/core/error/failures.dart';

/// A lightweight, dependency-free `Either`-style result type.
///
/// Architectural decision: rather than pulling in `fpdart`/`dartz`, we ship a
/// tiny sealed `Result<T>` so the domain layer can return `Future<Result<T>>`
/// from every repository method. This forces callers to handle the failure
/// branch explicitly (no thrown exceptions leaking across layers) while keeping
/// the dependency surface minimal.
sealed class Result<T> {
  const Result();

  /// `true` when this is a [Success].
  bool get isSuccess => this is Success<T>;

  /// The value if [Success], otherwise `null`.
  T? get valueOrNull => switch (this) {
        Success<T>(:final value) => value,
        _Failure<T>() => null,
      };

  /// Fold over both branches, returning a single value of type [R].
  R fold<R>(
    R Function(AppFailure failure) onFailure,
    R Function(T value) onSuccess,
  ) {
    return switch (this) {
      Success<T>(:final value) => onSuccess(value),
      _Failure<T>(:final failure) => onFailure(failure),
    };
  }

  /// Transform the success value, preserving the failure branch.
  Result<R> map<R>(R Function(T value) transform) {
    return switch (this) {
      Success<T>(:final value) => Success(transform(value)),
      _Failure<T>(:final failure) => _Failure(failure),
    };
  }
}

/// The successful branch wrapping a [value].
final class Success<T> extends Result<T> {
  const Success(this.value);
  final T value;
}

/// The error branch. Constructed via the [Failure] helper below.
final class _Failure<T> extends Result<T> {
  const _Failure(this.failure);
  final AppFailure failure;
}

/// Convenience constructor so call sites read `Failure(SomeFailure(...))`.
// ignore: non_constant_identifier_names
Result<T> Failure<T>(AppFailure failure) => _Failure<T>(failure);
