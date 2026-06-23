import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../models.dart';
import '../state/app_state.dart';
import '../theme.dart';

/// Products within a category — image placeholder, name, price, add-to-cart.
class CategoryScreen extends StatelessWidget {
  const CategoryScreen({super.key, required this.category, required this.items});
  final String category;
  final List<MenuItem> items;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: Text('$category (${items.length})'),
        actions: [
          IconButton(icon: const Icon(Icons.shopping_bag_outlined), onPressed: () => context.go('/cart')),
        ],
      ),
      body: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 16,
          crossAxisSpacing: 16,
          childAspectRatio: 0.74,
        ),
        itemCount: items.length,
        itemBuilder: (context, i) {
          final m = items[i];
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: scheme.surface,
                    borderRadius: BorderRadius.circular(14),
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [scheme.primary.withValues(alpha: 0.25), scheme.surface],
                    ),
                  ),
                  child: Icon(Icons.local_cafe, size: 44, color: scheme.primary),
                ),
              ),
              const SizedBox(height: 8),
              Text(m.name, maxLines: 2, overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 2),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(formatPaise(m.pricePaise),
                      style: TextStyle(color: BrewColors.champagne(context), fontWeight: FontWeight.bold)),
                  _AddButton(item: m),
                ],
              ),
            ],
          );
        },
      ),
    );
  }
}

class _AddButton extends StatelessWidget {
  const _AddButton({required this.item});
  final MenuItem item;
  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return IconButton.filled(
      visualDensity: VisualDensity.compact,
      onPressed: item.available
          ? () {
              appState.addToCart(item);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('${item.name} added'), duration: const Duration(milliseconds: 900)),
              );
            }
          : null,
      icon: Icon(Icons.add, color: scheme.onPrimary),
    );
  }
}
