import 'package:cyclemind_ai/core/constants/app_constants.dart';
import 'package:cyclemind_ai/services/ai/ai_service.dart';
import 'package:cyclemind_ai/services/ai/claude_ai_service.dart';
import 'package:cyclemind_ai/services/ai/mock_ai_service.dart';
import 'package:cyclemind_ai/services/vision/claude_vision_service.dart';
import 'package:cyclemind_ai/services/vision/mock_vision_service.dart';
import 'package:cyclemind_ai/services/vision/vision_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Selects the [AiService] implementation from [AppConstants.useMocks].
///
/// This single override point is what keeps the rest of the app decoupled from
/// Claude: features inject `ref.read(aiServiceProvider)` and never know whether
/// they're talking to the mock or the real, server-proxied service.
final aiServiceProvider = Provider<AiService>((ref) {
  return AppConstants.useMocks ? MockAiService() : ClaudeAiService();
});

/// Selects the [VisionService] implementation from [AppConstants.useMocks].
final visionServiceProvider = Provider<VisionService>((ref) {
  return AppConstants.useMocks ? MockVisionService() : ClaudeVisionService();
});
