import 'package:cyclemind_ai/core/constants/app_constants.dart';
import 'package:cyclemind_ai/core/providers/firebase_providers.dart';
import 'package:cyclemind_ai/features/auth/presentation/controllers/auth_controller.dart';
import 'package:cyclemind_ai/features/coach/data/repositories/firebase_rides_repository.dart';
import 'package:cyclemind_ai/features/coach/data/repositories/mock_rides_repository.dart';
import 'package:cyclemind_ai/features/coach/domain/entities/readiness.dart';
import 'package:cyclemind_ai/features/coach/domain/entities/ride.dart';
import 'package:cyclemind_ai/features/coach/domain/entities/training_plan.dart';
import 'package:cyclemind_ai/features/coach/domain/repositories/rides_repository.dart';
import 'package:cyclemind_ai/features/coach/domain/usecases/compute_readiness.dart';
import 'package:cyclemind_ai/services/ai/ai_providers.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Convenience: the signed-in user's id (empty when signed out).
final currentUserIdProvider = Provider<String>((ref) {
  return ref.watch(authStateProvider).valueOrNull?.id ?? '';
});

/// Binds the [RidesRepository] implementation.
final ridesRepositoryProvider = Provider<RidesRepository>((ref) {
  if (AppConstants.useMocks) return MockRidesRepository();
  return FirebaseRidesRepository(ref.watch(firestoreProvider));
});

/// Reactive list of the current user's rides.
final ridesStreamProvider = StreamProvider<List<Ride>>((ref) {
  final userId = ref.watch(currentUserIdProvider);
  if (userId.isEmpty) return const Stream.empty();
  return ref.watch(ridesRepositoryProvider).watchRides(userId);
});

/// Derived readiness score from recent rides.
final readinessProvider = Provider<Readiness>((ref) {
  final rides = ref.watch(ridesStreamProvider).valueOrNull ?? const [];
  return const ComputeReadiness().call(rides);
});

/// AI weekly insight over the last 7 days of rides.
final weeklyInsightProvider = FutureProvider<CoachInsight>((ref) async {
  final rides = ref.watch(ridesStreamProvider).valueOrNull ?? const [];
  final now = DateTime.now();
  final week = rides
      .where((r) => now.difference(r.startedAt).inDays <= 7)
      .toList();
  return ref.watch(aiServiceProvider).weeklyInsight(week);
});

/// Imperative training-plan generator.
class TrainingPlanController extends StateNotifier<AsyncValue<TrainingPlan?>> {
  TrainingPlanController(this._ref) : super(const AsyncData(null));
  final Ref _ref;

  Future<void> generate({
    required RiderLevel level,
    required RiderGoal goal,
  }) async {
    state = const AsyncLoading();
    try {
      final plan = await _ref
          .read(aiServiceProvider)
          .generateTrainingPlan(level: level, goal: goal);
      state = AsyncData(plan);
    } catch (e, st) {
      state = AsyncError(e, st);
    }
  }
}

final trainingPlanControllerProvider = StateNotifierProvider<
    TrainingPlanController, AsyncValue<TrainingPlan?>>((ref) {
  return TrainingPlanController(ref);
});
