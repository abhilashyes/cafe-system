import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../models.dart';
import '../state/app_state.dart';
import '../theme.dart';

/// Order history — the active order (if any) plus past orders.
class HistoryTab extends StatelessWidget {
  const HistoryTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('History')),
      body: ListenableBuilder(
        listenable: appState,
        builder: (context, _) {
          final active = appState.lastOrder;
          // A couple of sample past orders so the screen reads well in the demo.
          final past = [
            ('Caffè Latte, Butter Croissant', 45150),
            ('Cold Brew', 28000),
          ];
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (active != null) ...[
                const Text('Active', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 8),
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.local_cafe),
                    title: Text('Order #${active.pickupCode}'),
                    subtitle: Text('Status: ${active.status.replaceAll('_', ' ')}'),
                    trailing: TextButton(onPressed: () => context.go('/track'), child: const Text('Track')),
                  ),
                ),
                const SizedBox(height: 16),
              ],
              const Text('Past orders', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 8),
              for (final (summary, paise) in past)
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.receipt_long_outlined),
                    title: Text(summary, maxLines: 1, overflow: TextOverflow.ellipsis),
                    subtitle: Text(formatPaise(paise), style: TextStyle(color: BrewColors.champagne(context))),
                    trailing: const Icon(Icons.refresh),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}
