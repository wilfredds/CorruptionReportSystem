import 'package:cyclemind_ai/app/theme/app_colors.dart';
import 'package:cyclemind_ai/core/constants/app_constants.dart';
import 'package:cyclemind_ai/core/widgets/score_ring.dart';
import 'package:cyclemind_ai/core/widgets/stat_card.dart';
import 'package:cyclemind_ai/features/auth/presentation/controllers/auth_controller.dart';
import 'package:cyclemind_ai/features/bikes/presentation/controllers/bikes_providers.dart';
import 'package:cyclemind_ai/features/coach/domain/entities/ride.dart';
import 'package:cyclemind_ai/features/coach/presentation/controllers/coach_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Home dashboard: readiness, weekly stats, AI recommendation, bike health.
class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authStateProvider).valueOrNull;
    final readiness = ref.watch(readinessProvider);
    final rides = ref.watch(ridesStreamProvider).valueOrNull ?? const [];
    final weekly = ref.watch(weeklyInsightProvider);
    final reminders = ref.watch(remindersProvider);

    final week = _weekStats(rides);

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text('Hi ${user?.profile.displayName ?? 'rider'} 👋',
                style: Theme.of(context).textTheme.headlineSmall),
            Text('Here\'s your training snapshot',
                style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurfaceVariant)),
            const SizedBox(height: 20),

            // Readiness
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    ScoreRing(
                      score: readiness.score,
                      label: readiness.state.label,
                      color: switch (readiness.state) {
                        ReadinessState.ready => AppColors.success,
                        ReadinessState.moderate => AppColors.warning,
                        ReadinessState.recoveryNeeded => AppColors.danger,
                      },
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Today\'s readiness',
                              style: Theme.of(context).textTheme.titleMedium),
                          const SizedBox(height: 8),
                          _MiniBar('Sleep', readiness.sleepScore),
                          _MiniBar('Recovery', readiness.recoveryScore),
                          _MiniBar('Freshness', readiness.fatigueScore),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            const SectionHeader(title: 'This week'),
            Row(
              children: [
                Expanded(
                    child: StatCard(
                        icon: Icons.route,
                        value: '${week.km.toStringAsFixed(0)} km',
                        label: 'Distance')),
                const SizedBox(width: 12),
                Expanded(
                    child: StatCard(
                        icon: Icons.terrain,
                        value: '${week.elev.toStringAsFixed(0)} m',
                        label: 'Climbed',
                        color: AppColors.accent)),
                const SizedBox(width: 12),
                Expanded(
                    child: StatCard(
                        icon: Icons.local_fire_department,
                        value: '${week.calories}',
                        label: 'Calories',
                        color: AppColors.warning)),
              ],
            ),
            const SizedBox(height: 20),

            const SectionHeader(title: 'AI recommendation'),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: weekly.when(
                  data: (insight) => Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.auto_awesome,
                              color: AppColors.brand, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                              child: Text(insight.headline,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600))),
                        ],
                      ),
                      const SizedBox(height: 10),
                      ...insight.bullets.map((b) => Padding(
                            padding: const EdgeInsets.only(bottom: 6),
                            child: Text('• $b'),
                          )),
                    ],
                  ),
                  loading: () => const Padding(
                    padding: EdgeInsets.all(8),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                  error: (_, __) => const Text('Coach unavailable right now.'),
                ),
              ),
            ),
            const SizedBox(height: 20),

            const SectionHeader(title: 'Bike health'),
            Card(
              child: ListTile(
                leading: Icon(
                  reminders.isEmpty ? Icons.check_circle : Icons.warning_amber,
                  color: reminders.isEmpty ? AppColors.success : AppColors.warning,
                ),
                title: Text(reminders.isEmpty
                    ? 'All components healthy'
                    : '${reminders.length} maintenance alert(s)'),
                subtitle: Text(reminders.isEmpty
                    ? 'No maintenance due'
                    : reminders.first.message),
              ),
            ),
          ],
        ),
      ),
    );
  }

  _WeekStats _weekStats(List<Ride> rides) {
    final now = DateTime.now();
    final week = rides.where((r) => now.difference(r.startedAt).inDays <= 7);
    return _WeekStats(
      km: week.fold<double>(0, (s, r) => s + r.distanceKm),
      elev: week.fold<double>(0, (s, r) => s + r.elevationM),
      calories: week.fold<int>(0, (s, r) => s + r.calories),
    );
  }
}

class _WeekStats {
  _WeekStats({required this.km, required this.elev, required this.calories});
  final double km;
  final double elev;
  final int calories;
}

class _MiniBar extends StatelessWidget {
  const _MiniBar(this.label, this.value);
  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          SizedBox(width: 72, child: Text(label, style: const TextStyle(fontSize: 12))),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: value / 100,
                minHeight: 8,
                backgroundColor:
                    Theme.of(context).colorScheme.surfaceContainerHighest,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text('$value', style: const TextStyle(fontSize: 12)),
        ],
      ),
    );
  }
}
