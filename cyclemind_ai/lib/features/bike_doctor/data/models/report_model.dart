import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cyclemind_ai/core/constants/app_constants.dart';
import 'package:cyclemind_ai/features/bike_doctor/domain/entities/bike_health_report.dart';

/// Firestore mapping for [BikeHealthReport] — the `ai_reports/{reportId}`
/// document with `type == bikeHealth`.
class ReportModel {
  const ReportModel._();

  static BikeHealthReport fromMap(String id, Map<String, dynamic> map) {
    return BikeHealthReport(
      id: id,
      userId: map['userId'] as String? ?? '',
      bikeId: map['bikeId'] as String?,
      imageUrl: map['imageUrl'] as String?,
      healthScore: (map['healthScore'] as num?)?.toInt() ?? 0,
      riskLevel: RiskLevel.values.firstWhere(
        (r) => r.name == map['riskLevel'],
        orElse: () => RiskLevel.low,
      ),
      summary: map['summary'] as String? ?? '',
      findings: ((map['recommendations'] as List?) ?? const [])
          .map((f) => _findingFromMap(f as Map<String, dynamic>))
          .toList(),
      createdAt: (map['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }

  static Map<String, dynamic> toMap(BikeHealthReport report) => {
        'userId': report.userId,
        'bikeId': report.bikeId,
        'type': AiReportType.bikeHealth.name,
        'imageUrl': report.imageUrl,
        'healthScore': report.healthScore,
        'riskLevel': report.riskLevel.name,
        'summary': report.summary,
        'recommendations': report.findings.map(_findingToMap).toList(),
        'createdAt': Timestamp.fromDate(report.createdAt),
      };

  static BikeFinding _findingFromMap(Map<String, dynamic> f) => BikeFinding(
        area: f['area'] as String? ?? '',
        issue: f['issue'] as String? ?? '',
        severity: RiskLevel.values.firstWhere(
          (r) => r.name == f['severity'],
          orElse: () => RiskLevel.low,
        ),
        suggestions: ((f['suggestions'] as List?) ?? const []).cast<String>(),
      );

  static Map<String, dynamic> _findingToMap(BikeFinding f) => {
        'area': f.area,
        'issue': f.issue,
        'severity': f.severity.name,
        'suggestions': f.suggestions,
      };
}
