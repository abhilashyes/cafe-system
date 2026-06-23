import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../models.dart';
import '../state/app_state.dart';
import '../theme.dart';
import 'category_screen.dart';

/// Order screen styled after a Starbucks-style browse: Menu/Featured/Previous/
/// Favorites tabs, a "The Latest" feature strip, then category rows.
class OrderScreen extends StatefulWidget {
  const OrderScreen({super.key});
  @override
  State<OrderScreen> createState() => _OrderScreenState();
}

class _OrderScreenState extends State<OrderScreen> {
  late Future<List<MenuItem>> _menu;

  @override
  void initState() {
    super.initState();
    _menu = appState.api.storeMenu(appState.storeId);
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Order'),
          actions: [
            IconButton(icon: const Icon(Icons.search), onPressed: () {}),
            IconButton(icon: const Icon(Icons.shopping_bag_outlined), onPressed: () => context.go('/cart')),
          ],
          bottom: const TabBar(
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            tabs: [Tab(text: 'Menu'), Tab(text: 'Featured'), Tab(text: 'Previous'), Tab(text: 'Favorites')],
          ),
        ),
        body: TabBarView(
          children: [
            _MenuTab(menu: _menu),
            const _EmptyTab(label: 'Featured drinks will appear here.'),
            const _EmptyTab(label: 'Your previous orders will appear here.'),
            const _EmptyTab(label: 'Tap ♥ on an item to save a favorite.'),
          ],
        ),
      ),
    );
  }
}

class _EmptyTab extends StatelessWidget {
  const _EmptyTab({required this.label});
  final String label;
  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Text(label, textAlign: TextAlign.center,
              style: TextStyle(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6))),
        ),
      );
}

class _MenuTab extends StatelessWidget {
  const _MenuTab({required this.menu});
  final Future<List<MenuItem>> menu;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<MenuItem>>(
      future: menu,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snap.hasError) {
          return Center(child: Text('Could not load menu:\n${snap.error}', textAlign: TextAlign.center));
        }
        final items = snap.data!;
        // Distinct categories preserving order.
        final categories = <String>[];
        for (final m in items) {
          if (!categories.contains(m.category)) categories.add(m.category);
        }
        return ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
          children: [
            const Text('The Latest', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            const SizedBox(
              height: 150,
              child: Row(
                children: [
                  Expanded(child: _FeatureCard(title: 'Trending', icon: Icons.local_fire_department)),
                  SizedBox(width: 12),
                  Expanded(child: _FeatureCard(title: 'Energy Refreshers', icon: Icons.bolt)),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Drinks', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                Text('See all ${items.length}',
                    style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.w600)),
              ],
            ),
            const SizedBox(height: 4),
            for (final c in categories)
              _CategoryRow(
                category: c,
                count: items.where((m) => m.category == c).length,
                items: items.where((m) => m.category == c).toList(),
              ),
          ],
        );
      },
    );
  }
}

class _FeatureCard extends StatelessWidget {
  const _FeatureCard({required this.title, required this.icon});
  final String title;
  final IconData icon;
  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [scheme.primary, scheme.secondary],
        ),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: scheme.onPrimary),
          const Spacer(),
          Text(title,
              style: TextStyle(color: scheme.onPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
        ],
      ),
    );
  }
}

class _CategoryRow extends StatelessWidget {
  const _CategoryRow({required this.category, required this.count, required this.items});
  final String category;
  final int count;
  final List<MenuItem> items;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(vertical: 4),
      leading: CircleAvatar(
        radius: 26,
        backgroundColor: BrewColors.champagne(context).withValues(alpha: 0.25),
        child: Icon(_iconFor(category), color: BrewColors.champagne(context)),
      ),
      title: Text(category, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
      subtitle: Text('$count item${count == 1 ? '' : 's'}'),
      trailing: const Icon(Icons.chevron_right),
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => CategoryScreen(category: category, items: items)),
      ),
    );
  }

  IconData _iconFor(String category) {
    final c = category.toLowerCase();
    if (c.contains('cold') || c.contains('iced')) return Icons.ac_unit;
    if (c.contains('refresh')) return Icons.bolt;
    if (c.contains('bakery') || c.contains('food')) return Icons.bakery_dining;
    if (c.contains('protein')) return Icons.fitness_center;
    return Icons.coffee;
  }
}
