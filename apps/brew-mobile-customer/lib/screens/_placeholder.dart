import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Shared placeholder scaffold for Phase 0 screens.
class PlaceholderScreen extends StatelessWidget {
  const PlaceholderScreen({
    super.key,
    required this.title,
    required this.note,
    this.nextLabel,
    this.nextPath,
  });

  final String title;
  final String note;
  final String? nextLabel;
  final String? nextPath;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(note, style: Theme.of(context).textTheme.bodyLarge),
            const SizedBox(height: 12),
            const Text('Phase 0 placeholder — consumes brew-contracts APIs.',
                style: TextStyle(color: Colors.grey)),
            const Spacer(),
            if (nextLabel != null && nextPath != null)
              FilledButton(
                onPressed: () => context.go(nextPath!),
                child: Text(nextLabel!),
              ),
          ],
        ),
      ),
    );
  }
}
