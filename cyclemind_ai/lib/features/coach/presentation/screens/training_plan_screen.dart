import 'package:cyclemind_ai/app/theme/app_colors.dart';
import 'package:cyclemind_ai/core/constants/app_constants.dart';
import 'package:cyclemind_ai/features/auth/presentation/controllers/auth_controller.dart';
import 'package:cyclemind_ai/features/coach/domain/entities/training_plan.dart';
import 'package:cyclemind_ai/features/coach/presentation/controllers/coach_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// AI training planner: pick a goal, generate a structured multi-week plan.
class TrainingPlanScreen extends ConsumerStatefulWidget {
  const TrainingPlanScreen({super.key});

  @override
  ConsumerState<TrainingPlanScreen> createState() => _TrainingPlanScreenState();
}

class _TrainingPlanScreenState extends ConsumerState<TrainingPlanScreen> {
  RiderGoal _goal = RiderGoal.improveEndurance;

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authStateProvider).valueOrNull;
    final level = user?.profile.level ?? RiderLevel.beginner;
    final planState = ref.watch(trainingPlanControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Training plan')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Goal', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: RiderGoal.values.map((g) {
              return ChoiceChip(
                label: Text(g.label),
                selected: _goal == g,
                onSelected: (_) => setState(() => _goal = g),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: planState.isLoading
                ? null
                : () => ref
                    .read(trainingPlanControllerProvider.notifier)
                    .generate(level: level, goal: _goal),
            icon: const Icon(Icons.auto_awesome),
            label: const Text('Generate plan'),
          ),
          const SizedBox(height: 20),
          planState.when(
            data: (plan) =>
                plan == null ? const SizedBox.shrink() : _PlanView(plan: plan),
            loading: () =>
                const Center(child: Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(),
                )),
            error: (e, _) => Text('Error: $e'),
          ),
        ],
      ),
    );
  }
}

class _PlanView extends StatelessWidget {
  const _PlanView({required this.plan});
  final TrainingPlan plan;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Icon(Icons.flag, color: AppColors.brand),
                const SizedBox(width: 10),
                Expanded(child: Text(plan.summary)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        ...plan.weeks.map((w) => Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ExpansionTile(
                title: Text('Week ${w.weekNumber} · ${w.focus}'),
                childrenPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                children: w.days
                    .map((d) => ListTile(
                          dense: true,
                          contentPadding: EdgeInsets.zero,
                          leading: CircleAvatar(
                            radius: 16,
                            backgroundColor: d.isRest
                                ? Colors.grey.withValues(alpha: 0.3)
                                : AppColors.brand.withValues(alpha: 0.2),
                            child: Text(d.dayLabel,
                                style: const TextStyle(fontSize: 10)),
                          ),
                          title: Text(d.title),
                          subtitle: Text(d.description),
                          trailing: d.durationMin != null
                              ? Text('${d.durationMin}m')
                              : null,
                        ))
                    .toList(),
              ),
            )),
      ],
    );
  }
}
