import 'dart:convert';

import 'package:cyclemind_ai/core/constants/app_constants.dart';
import 'package:cyclemind_ai/core/error/exceptions.dart';
import 'package:cyclemind_ai/services/ai/ai_service.dart';
import 'package:cyclemind_ai/features/coach/domain/entities/readiness.dart';
import 'package:cyclemind_ai/features/coach/domain/entities/ride.dart';
import 'package:cyclemind_ai/features/coach/domain/entities/training_plan.dart';
import 'package:http/http.dart' as http;

/// Production [AiService] that proxies to server-side Cloud Functions.
///
/// SECURITY (architectural decision): the Claude API key is NEVER shipped in
/// the app. Each method posts to an HTTPS Cloud Function (see
/// `functions/src/index.ts`) which holds the key and calls Claude
/// (model: [AppConstants.claudeModel]) server-side. This impl is selected only
/// when `--dart-define=USE_MOCKS=false` and a `FUNCTIONS_BASE_URL` is provided.
class ClaudeAiService implements AiService {
  ClaudeAiService({http.Client? client, String? baseUrl})
      : _client = client ?? http.Client(),
        _baseUrl = baseUrl ??
            const String.fromEnvironment('FUNCTIONS_BASE_URL', defaultValue: '');

  final http.Client _client;
  final String _baseUrl;

  Future<Map<String, dynamic>> _post(String fn, Map<String, dynamic> body) async {
    if (_baseUrl.isEmpty) {
      throw AiException('FUNCTIONS_BASE_URL not configured.');
    }
    final resp = await _client.post(
      Uri.parse('$_baseUrl/$fn'),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode(body),
    );
    if (resp.statusCode != 200) {
      throw AiException('AI function "$fn" failed: ${resp.statusCode}');
    }
    return jsonDecode(resp.body) as Map<String, dynamic>;
  }

  @override
  Future<CoachInsight> summarizeRide(Ride ride,
      {List<Ride> history = const []}) async {
    final json = await _post('summarizeRide', {
      'ride': _rideJson(ride),
      'history': history.map(_rideJson).toList(),
    });
    return CoachInsight(
      headline: json['headline'] as String,
      bullets: (json['bullets'] as List).cast<String>(),
    );
  }

  @override
  Future<CoachInsight> weeklyInsight(List<Ride> rides) async {
    final json =
        await _post('weeklyInsight', {'rides': rides.map(_rideJson).toList()});
    return CoachInsight(
      headline: json['headline'] as String,
      bullets: (json['bullets'] as List).cast<String>(),
    );
  }

  @override
  Future<String> readinessAdvice(Readiness readiness) async {
    final json = await _post('readinessAdvice', {
      'score': readiness.score,
      'sleep': readiness.sleepScore,
      'recovery': readiness.recoveryScore,
      'fatigue': readiness.fatigueScore,
    });
    return json['advice'] as String;
  }

  @override
  Future<TrainingPlan> generateTrainingPlan({
    required RiderLevel level,
    required RiderGoal goal,
  }) async {
    final json = await _post('generateTrainingPlan', {
      'level': level.name,
      'goal': goal.name,
    });
    // The Cloud Function returns a structured plan; parsing kept defensive.
    return TrainingPlan(
      id: json['id'] as String? ?? 'plan',
      goal: goal,
      level: level,
      summary: json['summary'] as String? ?? '',
      weeks: ((json['weeks'] as List?) ?? const [])
          .map((w) => _weekFromJson(w as Map<String, dynamic>))
          .toList(),
      createdAt: DateTime.now(),
    );
  }

  @override
  Future<String> mechanicChat(String message,
      {List<ChatTurn> history = const []}) async {
    final json = await _post('mechanicChat', {
      'message': message,
      'history':
          history.map((t) => {'role': t.role, 'text': t.text}).toList(),
    });
    return json['reply'] as String;
  }

  Map<String, dynamic> _rideJson(Ride r) => {
        'distanceKm': r.distanceKm,
        'elevationM': r.elevationM,
        'avgSpeedKmh': r.avgSpeedKmh,
        'durationSec': r.durationSec,
        'cadence': r.cadence,
        'heartRate': r.heartRate,
        'power': r.power,
      };

  TrainingWeek _weekFromJson(Map<String, dynamic> w) => TrainingWeek(
        weekNumber: w['weekNumber'] as int? ?? 1,
        focus: w['focus'] as String? ?? '',
        days: ((w['days'] as List?) ?? const [])
            .map((d) => _dayFromJson(d as Map<String, dynamic>))
            .toList(),
      );

  TrainingDay _dayFromJson(Map<String, dynamic> d) => TrainingDay(
        dayLabel: d['dayLabel'] as String? ?? '',
        title: d['title'] as String? ?? '',
        description: d['description'] as String? ?? '',
        durationMin: d['durationMin'] as int?,
        isRest: d['isRest'] as bool? ?? false,
      );
}
