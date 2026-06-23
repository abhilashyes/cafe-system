import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../state/app_state.dart';
import 'home_tab.dart';
import 'order_screen.dart';
import 'history_tab.dart';
import 'rewards_tab.dart';

/// Bottom-nav shell: Home · Order · History · Rewards, with a persistent
/// pickup-store bar (like the reference) sitting above the nav bar.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});
  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 1; // default to Order

  static const _tabs = [HomeTab(), OrderScreen(), HistoryTab(), RewardsTab()];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _tabs),
      bottomNavigationBar: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const _PickupBar(),
          NavigationBar(
            selectedIndex: _index,
            onDestinationSelected: (i) => setState(() => _index = i),
            destinations: const [
              NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
              NavigationDestination(icon: Icon(Icons.local_cafe_outlined), selectedIcon: Icon(Icons.local_cafe), label: 'Order'),
              NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long), label: 'History'),
              NavigationDestination(icon: Icon(Icons.star_outline), selectedIcon: Icon(Icons.star), label: 'Rewards'),
            ],
          ),
        ],
      ),
    );
  }
}

/// Dark pickup-store bar with the current store + a cart badge → cart.
class _PickupBar extends StatelessWidget {
  const _PickupBar();

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Material(
      color: scheme.surface,
      child: InkWell(
        onTap: () => context.go('/cart'),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            children: [
              const Icon(Icons.storefront, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Pickup store', style: TextStyle(fontSize: 11, color: scheme.onSurface.withValues(alpha: 0.6))),
                    const Text('MG Road, Bengaluru · 2.1 km',
                        maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
              ListenableBuilder(
                listenable: appState,
                builder: (context, _) {
                  final count = appState.cart.fold<int>(0, (s, l) => s + l.quantity);
                  return Badge(
                    isLabelVisible: count > 0,
                    label: Text('$count'),
                    child: const Icon(Icons.shopping_bag_outlined),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
