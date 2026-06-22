import 'package:flutter/material.dart';
import '_placeholder.dart';

/// Store-aware menu with modifiers, allergens/nutrition; pick dine-in or pickup.
class MenuScreen extends StatelessWidget {
  const MenuScreen({super.key});
  @override
  Widget build(BuildContext context) => const PlaceholderScreen(
        title: 'Menu',
        note: 'Store-aware menu (price/availability vary by store), modifiers '
            '(size, milk, shots), allergen & nutrition info. Choose dine-in '
            '(optional table no.) or pickup, now or a future slot.',
        nextLabel: 'Go to cart',
        nextPath: '/cart',
      );
}
