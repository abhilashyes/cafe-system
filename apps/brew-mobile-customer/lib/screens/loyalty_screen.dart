import 'package:flutter/material.dart';

import '../models.dart';
import '../state/app_state.dart';

// Tier thresholds mirror the backend seed (qualifying spend in paise).
const _tiers = [
  ('t1', 'Welcome', 0),
  ('t2', 'Green', 500000),
  ('t3', 'Gold', 1500000),
  ('t4', 'Platinum', 4000000),
  ('t5', 'Black', 10000000),
];

/// Loyalty: current tier (of 5), stars balance, progress to the next tier.
class LoyaltyScreen extends StatefulWidget {
  const LoyaltyScreen({super.key});
  @override
  State<LoyaltyScreen> createState() => _LoyaltyScreenState();
}

class _LoyaltyScreenState extends State<LoyaltyScreen> {
  @override
  void initState() {
    super.initState();
    appState.refreshLoyalty();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Rewards')),
      body: ListenableBuilder(
        listenable: appState,
        builder: (context, _) {
          final l = appState.loyalty;
          if (l == null) {
            return const Center(child: CircularProgressIndicator());
          }
          final idx = _tiers.indexWhere((t) => t.$1 == l.tierId);
          final tier = _tiers[idx < 0 ? 0 : idx];
          final next = (idx >= 0 && idx < _tiers.length - 1) ? _tiers[idx + 1] : null;
          final progress = next == null
              ? 1.0
              : (l.qualifyingSpend / next.$3).clamp(0.0, 1.0);

          return Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Tier ${tier.$1.substring(1)} of 5', style: Theme.of(context).textTheme.labelMedium),
                Text(tier.$2, style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                Text('⭐ ${l.balanceStars} stars', style: const TextStyle(fontSize: 20)),
                const SizedBox(height: 24),
                if (next != null) ...[
                  Text('Progress to ${next.$2}'),
                  const SizedBox(height: 8),
                  LinearProgressIndicator(value: progress),
                  const SizedBox(height: 8),
                  Text('${formatPaise(l.qualifyingSpend)} / ${formatPaise(next.$3)} qualifying spend'),
                ] else
                  const Text('You’ve reached the top tier 🎉'),
                const SizedBox(height: 24),
                const Text('Earn stars on every spend; redeem them at checkout.',
                    style: TextStyle(color: Colors.grey)),
              ],
            ),
          );
        },
      ),
    );
  }
}
