import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme.dart';
import '../widgets/brew_logo.dart';

/// Home tab — greeting, a feature hero, and quick links.
class HomeTab extends StatelessWidget {
  const HomeTab({super.key});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: const BrewLogo(size: 18),
        actions: [
          IconButton(icon: const Icon(Icons.place_outlined), onPressed: () => context.go('/stores')),
          IconButton(icon: const Icon(Icons.shield_outlined), onPressed: () => context.go('/privacy')),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Good day ☕', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text('Order ahead and skip the queue.',
              style: TextStyle(color: scheme.onSurface.withValues(alpha: 0.65))),
          const SizedBox(height: 20),
          Container(
            height: 170,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [scheme.primary, scheme.secondary],
              ),
            ),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.local_cafe, color: scheme.onPrimary, size: 30),
                const Spacer(),
                Text('The Latest',
                    style: TextStyle(color: scheme.onPrimary, fontSize: 20, fontWeight: FontWeight.bold)),
                Text('Try our new Energy Refreshers',
                    style: TextStyle(color: scheme.onPrimary.withValues(alpha: 0.9))),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Card(
            child: ListTile(
              leading: Icon(Icons.card_giftcard, color: BrewColors.champagne(context)),
              title: const Text('Earn stars on every order'),
              subtitle: const Text('Check the Rewards tab to track your tier.'),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.storefront_outlined),
              title: const Text('Pickup store'),
              subtitle: const Text('MG Road, Bengaluru · 2.1 km'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.go('/stores'),
            ),
          ),
        ],
      ),
    );
  }
}
