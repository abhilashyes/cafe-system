import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../models.dart';
import '../state/app_state.dart';

/// Store-aware menu. Tap an item to add it to the cart.
class MenuScreen extends StatefulWidget {
  const MenuScreen({super.key});
  @override
  State<MenuScreen> createState() => _MenuScreenState();
}

class _MenuScreenState extends State<MenuScreen> {
  late Future<List<MenuItem>> _menu;

  @override
  void initState() {
    super.initState();
    _menu = appState.api.storeMenu(appState.storeId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Menu'),
        actions: [
          ListenableBuilder(
            listenable: appState,
            builder: (context, _) => Stack(
              alignment: Alignment.center,
              children: [
                IconButton(
                  icon: const Icon(Icons.shopping_cart),
                  onPressed: () => context.go('/cart'),
                ),
                if (appState.cart.isNotEmpty)
                  Positioned(
                    right: 6,
                    top: 6,
                    child: CircleAvatar(
                      radius: 9,
                      backgroundColor: Colors.red,
                      child: Text('${appState.cart.length}',
                          style: const TextStyle(fontSize: 11, color: Colors.white)),
                    ),
                  ),
              ],
            ),
          ),
          IconButton(icon: const Icon(Icons.star), onPressed: () => context.go('/loyalty')),
        ],
      ),
      body: FutureBuilder<List<MenuItem>>(
        future: _menu,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError) {
            return Center(child: Text('Could not load menu:\n${snap.error}', textAlign: TextAlign.center));
          }
          final items = snap.data!;
          return ListView.separated(
            itemCount: items.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, i) {
              final m = items[i];
              return ListTile(
                title: Text(m.name),
                subtitle: Text('${m.category} • ${formatPaise(m.pricePaise)}'),
                trailing: m.available
                    ? FilledButton.tonal(onPressed: () => appState.addToCart(m), child: const Text('Add'))
                    : const Text('86', style: TextStyle(color: Colors.grey)),
              );
            },
          );
        },
      ),
    );
  }
}
