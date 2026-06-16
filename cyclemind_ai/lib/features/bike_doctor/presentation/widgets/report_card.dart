import 'package:cyclemind_ai/app/theme/app_colors.dart';
import 'package:cyclemind_ai/core/constants/app_constants.dart';
import 'package:cyclemind_ai/core/widgets/score_ring.dart';
import 'package:cyclemind_ai/features/bike_doctor/domain/entities/bike_health_report.dart';
import 'package:flutter/material.dart';

/// Renders a [BikeHealthReport]: overall score + risk, then per-area findings
/// with suggested fixes.
class ReportCard extends StatelessWidget {
  const ReportCard({super.key, required this.report});
  final BikeHealthReport report;

  Color get _riskColor => switch (report.riskLevel) {
        RiskLevel.low => AppColors.success,
        RiskLevel.medium => AppColors.warning,
        RiskLevel.high => AppColors.danger,
      };

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                ScoreRing(
                  score: report.healthScore,
                  label: 'Health',
                  size: 120,
                  color: _riskColor,
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Chip(
                        label: Text('${report.riskLevel.label} risk'),
                        backgroundColor: _riskColor.withValues(alpha: 0.18),
                        side: BorderSide.none,
                      ),
                      const SizedBox(height: 8),
                      Text(report.summary),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        ...report.findings.map((f) => _FindingTile(finding: f)),
      ],
    );
  }
}

class _FindingTile extends StatelessWidget {
  const _FindingTile({required this.finding});
  final BikeFinding finding;

  @override
  Widget build(BuildContext context) {
    final color = switch (finding.severity) {
      RiskLevel.low => AppColors.success,
      RiskLevel.medium => AppColors.warning,
      RiskLevel.high => AppColors.danger,
    };
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ExpansionTile(
        leading: Icon(Icons.build_circle, color: color),
        title: Text(finding.area,
            style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text(finding.issue),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        children: finding.suggestions
            .map((s) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.check, size: 16),
                      const SizedBox(width: 8),
                      Expanded(child: Text(s)),
                    ],
                  ),
                ))
            .toList(),
      ),
    );
  }
}
