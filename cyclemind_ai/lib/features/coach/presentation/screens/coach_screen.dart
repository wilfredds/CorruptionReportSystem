import 'package:cyclemind_ai/app/theme/app_colors.dart';
import 'package:cyclemind_ai/core/widgets/empty_state.dart';
import 'package:cyclemind_ai/core/widgets/stat_card.dart';
import 'package:cyclemind_ai/features/coach/domain/entities/ride.dart';
import 'package:cyclemind_ai/features/coach/presentation/controllers/coach_providers.dart';
import 'package:cyclemind_ai/features/coach/presentation/widgets/trend_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

/// AI Cycling Coach: ride history, performance trend, and entry points to the
/// training planner and mechanic chat.
class CoachScreen extends ConsumerWidget {
  const CoachScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ridesAsync = ref.watch(ridesStreamProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Coach'),
        actions: [
          IconButton(
            tooltip: 'Training plan',
            icon: const Icon(Icons.event_note),
            onPressed: () => context.push('/training'),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/rides/new'),
        icon: const Icon(Icons.add),
        label: const Text('Log ride'),
      ),
      body: ridesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (rides) {
          if (rides.isEmpty) {
            return EmptyState(
              icon: Icons.directions_bike,
              title: 'No rides yet',
              message: 'Log your first ride to unlock AI insights.',
              action: FilledButton(
                onPressed: () => context.push('/rides/new'),
                child: const Text('Log a ride'),
              ),
            );
          }
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const SectionHeader(title: 'Distance trend (last rides)'),
              Card(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(8, 20, 16, 8),
                  child: SizedBox(
                    height: 180,
                    child: TrendChart(
                      values: rides.reversed
                          .map((r) => r.distanceKm)
                          .toList(),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const SectionHeader(title: 'Ride history'),
              ...rides.map((r) => _RideTile(ride: r)),
              const SizedBox(height: 80),
            ],
          );
        },
      ),
    );
  }
}

class _RideTile extends ConsumerWidget {
  const _RideTile({required this.ride});
  final Ride ride;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Dismissible(
        key: ValueKey(ride.id),
        direction: DismissDirection.endToStart,
        background: Container(
          alignment: Alignment.centerRight,
          padding: const EdgeInsets.only(right: 20),
          decoration: BoxDecoration(
            color: AppColors.danger.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Icon(Icons.delete, color: AppColors.danger),
        ),
        onDismissed: (_) =>
            ref.read(ridesRepositoryProvider).deleteRide(ride.id),
        child: ListTile(
          leading: const CircleAvatar(child: Icon(Icons.directions_bike)),
          title: Text(ride.title),
          subtitle: Text(
            '${DateFormat.MMMd().format(ride.startedAt)} · '
            '${ride.distanceKm.toStringAsFixed(1)} km · '
            '${ride.elevationM.toStringAsFixed(0)} m · '
            '${ride.avgSpeedKmh.toStringAsFixed(1)} km/h',
          ),
          trailing: Text('${ride.calories} kcal',
              style: const TextStyle(color: AppColors.warning)),
        ),
      ),
    );
  }
}
