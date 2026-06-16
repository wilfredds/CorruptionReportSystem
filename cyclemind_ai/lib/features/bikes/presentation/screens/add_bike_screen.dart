import 'package:cyclemind_ai/features/auth/presentation/controllers/auth_controller.dart';
import 'package:cyclemind_ai/features/bikes/domain/entities/bike.dart';
import 'package:cyclemind_ai/features/bikes/presentation/controllers/bikes_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

/// Register a new bike with its core specs. Components/maintenance are added
/// later from the bike detail screen.
class AddBikeScreen extends ConsumerStatefulWidget {
  const AddBikeScreen({super.key});

  @override
  ConsumerState<AddBikeScreen> createState() => _AddBikeScreenState();
}

class _AddBikeScreenState extends ConsumerState<AddBikeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _frame = TextEditingController();
  final _groupset = TextEditingController();
  final _tires = TextEditingController();
  final _mileage = TextEditingController(text: '0');

  @override
  void dispose() {
    for (final c in [_name, _frame, _groupset, _tires, _mileage]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final user = ref.read(authStateProvider).valueOrNull;
    final bike = Bike(
      id: const Uuid().v4(),
      userId: user?.id ?? '',
      name: _name.text.trim(),
      frame: _frame.text.trim(),
      groupset: _groupset.text.trim(),
      tires: _tires.text.trim(),
      totalMileageKm: double.tryParse(_mileage.text) ?? 0,
    );
    await ref.read(bikesRepositoryProvider).addBike(bike);
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add bike')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _field(_name, 'Name (e.g. Roadie)', required: true),
            const SizedBox(height: 14),
            _field(_frame, 'Frame'),
            const SizedBox(height: 14),
            _field(_groupset, 'Groupset (e.g. Shimano 105)'),
            const SizedBox(height: 14),
            _field(_tires, 'Tires'),
            const SizedBox(height: 14),
            _field(_mileage, 'Current mileage (km)', number: true),
            const SizedBox(height: 28),
            FilledButton.icon(
              onPressed: _save,
              icon: const Icon(Icons.save),
              label: const Text('Save bike'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _field(TextEditingController c, String label,
      {bool required = false, bool number = false}) {
    return TextFormField(
      controller: c,
      keyboardType: number
          ? const TextInputType.numberWithOptions(decimal: true)
          : TextInputType.text,
      decoration: InputDecoration(labelText: label),
      validator: required
          ? (v) => (v == null || v.trim().isEmpty) ? 'Required' : null
          : null,
    );
  }
}
