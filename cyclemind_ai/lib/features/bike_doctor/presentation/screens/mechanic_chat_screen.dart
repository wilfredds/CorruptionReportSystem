import 'package:cyclemind_ai/app/theme/app_colors.dart';
import 'package:cyclemind_ai/services/ai/ai_providers.dart';
import 'package:cyclemind_ai/services/ai/ai_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// AI Bike Mechanic chat — a conversational diagnostic assistant.
class MechanicChatScreen extends ConsumerStatefulWidget {
  const MechanicChatScreen({super.key});

  @override
  ConsumerState<MechanicChatScreen> createState() => _MechanicChatScreenState();
}

class _MechanicChatScreenState extends ConsumerState<MechanicChatScreen> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  final List<ChatTurn> _turns = [
    const ChatTurn(
      role: 'assistant',
      text: 'Hi! I\'m your AI bike mechanic. Describe the symptom — e.g. '
          '"my gears skip when climbing" — and I\'ll help you diagnose it.',
    ),
  ];
  bool _sending = false;

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _input.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() {
      _turns.add(ChatTurn(role: 'user', text: text));
      _sending = true;
      _input.clear();
    });
    _scrollToEnd();

    final reply = await ref
        .read(aiServiceProvider)
        .mechanicChat(text, history: _turns);
    if (!mounted) return;
    setState(() {
      _turns.add(ChatTurn(role: 'assistant', text: reply));
      _sending = false;
    });
    _scrollToEnd();
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(_scroll.position.maxScrollExtent,
            duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('AI Mechanic')),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scroll,
              padding: const EdgeInsets.all(16),
              itemCount: _turns.length + (_sending ? 1 : 0),
              itemBuilder: (_, i) {
                if (i >= _turns.length) {
                  return const _Bubble(
                    text: 'Typing…',
                    isUser: false,
                  );
                }
                final t = _turns[i];
                return _Bubble(text: t.text, isUser: t.isUser);
              },
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _input,
                      onSubmitted: (_) => _send(),
                      decoration: const InputDecoration(
                        hintText: 'Describe the issue…',
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _send,
                    icon: const Icon(Icons.send),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble({required this.text, required this.isUser});
  final String text;
  final bool isUser;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.78),
        decoration: BoxDecoration(
          color: isUser
              ? AppColors.brand.withValues(alpha: 0.22)
              : scheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(text),
      ),
    );
  }
}
