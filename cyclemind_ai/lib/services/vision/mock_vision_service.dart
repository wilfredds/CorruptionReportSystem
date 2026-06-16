import 'dart:convert';
import 'dart:typed_data';

import 'package:cyclemind_ai/core/constants/app_constants.dart';
import 'package:cyclemind_ai/features/bike_doctor/domain/entities/bike_health_report.dart';
import 'package:cyclemind_ai/services/vision/vision_service.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:uuid/uuid.dart';

/// Offline, deterministic implementation of [VisionService].
///
/// Instead of calling a real vision model, it derives a stable pseudo-random
/// result from the image bytes (so the same photo always yields the same
/// report) and dresses the findings with real repair guidance ported from the
/// "Bike Guide PH" troubleshooting dataset (`assets/data/troubleshooting.json`).
class MockVisionService implements VisionService {
  static const _uuid = Uuid();
  List<Map<String, dynamic>>? _knowledge;

  Future<List<Map<String, dynamic>>> _loadKnowledge() async {
    if (_knowledge != null) return _knowledge!;
    try {
      final raw = await rootBundle.loadString(AppConstants.troubleshootingAsset);
      _knowledge = (jsonDecode(raw) as List).cast<Map<String, dynamic>>();
    } catch (_) {
      _knowledge = const [];
    }
    return _knowledge!;
  }

  @override
  Future<BikeHealthReport> analyzeBikePhoto({
    required Uint8List imageBytes,
    required BikePart part,
    required String userId,
    String? bikeId,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 900));
    final knowledge = await _loadKnowledge();

    // Deterministic seed from the image so results are stable per-photo.
    final seed = imageBytes.isEmpty
        ? 7
        : imageBytes.fold<int>(0, (a, b) => (a + b) % 100);

    final findings = _findingsFor(part, seed, knowledge);
    final worst = findings.isEmpty
        ? RiskLevel.low
        : findings
            .map((f) => f.severity)
            .reduce((a, b) => a.index >= b.index ? a : b);
    final healthScore = (100 - findings.length * 12 - worst.index * 10)
        .clamp(35, 98);

    return BikeHealthReport(
      id: _uuid.v4(),
      userId: userId,
      bikeId: bikeId,
      healthScore: healthScore,
      riskLevel: worst,
      findings: findings,
      summary: findings.isEmpty
          ? 'No significant issues detected in this ${part.label.toLowerCase()} scan.'
          : 'Detected ${findings.length} item(s) needing attention. '
              'Overall risk: ${worst.label.toLowerCase()}.',
      createdAt: DateTime.now(),
    );
  }

  List<BikeFinding> _findingsFor(
    BikePart part,
    int seed,
    List<Map<String, dynamic>> knowledge,
  ) {
    List<String> suggestionsFor(String keyword) {
      final match = knowledge.firstWhere(
        (k) => (k['keywords'] as List?)
                ?.any((kw) => kw.toString().contains(keyword)) ??
            false,
        orElse: () => const {},
      );
      final steps = (match['steps'] as List?)?.cast<String>() ?? const [];
      return steps.take(3).toList();
    }

    final pool = <BikeFinding>[
      if (part == BikePart.whole || part == BikePart.tires)
        BikeFinding(
          area: 'Tires',
          issue: seed.isEven ? 'Worn tread and low pressure indicators' : 'Minor sidewall cracking',
          severity: seed.isEven ? RiskLevel.medium : RiskLevel.low,
          suggestions: suggestionsFor('tire pressure'),
        ),
      if (part == BikePart.whole || part == BikePart.chain || part == BikePart.drivetrain)
        BikeFinding(
          area: 'Chain',
          issue: seed % 3 == 0 ? 'Rust and dirt build-up; possible wear' : 'Dry chain, needs lubrication',
          severity: seed % 3 == 0 ? RiskLevel.high : RiskLevel.medium,
          suggestions: suggestionsFor('chain lube'),
        ),
      if (part == BikePart.whole || part == BikePart.brakes)
        BikeFinding(
          area: 'Brakes',
          issue: seed % 4 == 0 ? 'Brake pads near end of life' : 'Pads OK, slight contamination',
          severity: seed % 4 == 0 ? RiskLevel.high : RiskLevel.low,
          suggestions: suggestionsFor('brake'),
        ),
      if (part == BikePart.whole || part == BikePart.frame)
        BikeFinding(
          area: 'Frame',
          issue: seed % 5 == 0 ? 'Paint chip near head tube (monitor)' : 'No visible cracks or corrosion',
          severity: seed % 5 == 0 ? RiskLevel.medium : RiskLevel.low,
          suggestions: const [
            'Clean and inspect the area with a flashlight.',
            'Watch for spreading cracks; consult a shop if unsure.',
          ],
        ),
    ];

    // Keep only findings that actually represent an issue for a tighter report.
    return pool.where((f) => f.severity != RiskLevel.low || part != BikePart.whole).toList();
  }
}
