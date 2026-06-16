import 'dart:convert';
import 'dart:typed_data';

import 'package:cyclemind_ai/core/constants/app_constants.dart';
import 'package:cyclemind_ai/core/error/exceptions.dart';
import 'package:cyclemind_ai/features/bike_doctor/domain/entities/bike_health_report.dart';
import 'package:cyclemind_ai/services/vision/vision_service.dart';
import 'package:http/http.dart' as http;
import 'package:uuid/uuid.dart';

/// Production [VisionService] that proxies bike-photo analysis to a Cloud
/// Function calling Claude's vision model (model: [AppConstants.claudeModel]).
///
/// The base64-encoded image is sent to the `analyzeBike` function which returns
/// a structured JSON report. The API key stays server-side.
class ClaudeVisionService implements VisionService {
  ClaudeVisionService({http.Client? client, String? baseUrl})
      : _client = client ?? http.Client(),
        _baseUrl = baseUrl ??
            const String.fromEnvironment('FUNCTIONS_BASE_URL', defaultValue: '');

  static const _uuid = Uuid();
  final http.Client _client;
  final String _baseUrl;

  @override
  Future<BikeHealthReport> analyzeBikePhoto({
    required Uint8List imageBytes,
    required BikePart part,
    required String userId,
    String? bikeId,
  }) async {
    if (_baseUrl.isEmpty) {
      throw AiException('FUNCTIONS_BASE_URL not configured.');
    }
    final resp = await _client.post(
      Uri.parse('$_baseUrl/analyzeBike'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode({
        'part': part.name,
        'imageBase64': base64Encode(imageBytes),
      }),
    );
    if (resp.statusCode != 200) {
      throw AiException('analyzeBike failed: ${resp.statusCode}');
    }
    final json = jsonDecode(resp.body) as Map<String, dynamic>;

    return BikeHealthReport(
      id: _uuid.v4(),
      userId: userId,
      bikeId: bikeId,
      healthScore: (json['healthScore'] as num?)?.toInt() ?? 0,
      riskLevel: _risk(json['riskLevel'] as String?),
      summary: json['summary'] as String? ?? '',
      findings: ((json['findings'] as List?) ?? const [])
          .map((f) => _findingFromJson(f as Map<String, dynamic>))
          .toList(),
      createdAt: DateTime.now(),
    );
  }

  BikeFinding _findingFromJson(Map<String, dynamic> f) => BikeFinding(
        area: f['area'] as String? ?? 'Unknown',
        issue: f['issue'] as String? ?? '',
        severity: _risk(f['severity'] as String?),
        suggestions: ((f['suggestions'] as List?) ?? const []).cast<String>(),
      );

  RiskLevel _risk(String? s) => switch (s) {
        'high' => RiskLevel.high,
        'medium' => RiskLevel.medium,
        _ => RiskLevel.low,
      };
}
