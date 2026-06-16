import 'package:cyclemind_ai/core/error/failures.dart';
import 'package:cyclemind_ai/core/utils/result.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Result', () {
    test('Success folds to success branch', () {
      const Result<int> r = Success(42);
      expect(r.isSuccess, isTrue);
      expect(r.valueOrNull, 42);
      expect(r.fold((_) => 'fail', (v) => 'ok:$v'), 'ok:42');
    });

    test('Failure folds to failure branch', () {
      final r = Failure<int>(const ServerFailure('boom'));
      expect(r.isSuccess, isFalse);
      expect(r.valueOrNull, isNull);
      expect(r.fold((f) => f.message, (_) => 'ok'), 'boom');
    });

    test('map transforms success only', () {
      const Result<int> r = Success(2);
      expect(r.map((v) => v * 10).valueOrNull, 20);
      final f = Failure<int>(const CacheFailure());
      expect(f.map((v) => v * 10).valueOrNull, isNull);
    });
  });
}
