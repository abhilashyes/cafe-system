import 'package:flutter/material.dart';
import '_placeholder.dart';

/// Map of stores, hours, distance.
class StoreLocatorScreen extends StatelessWidget {
  const StoreLocatorScreen({super.key});
  @override
  Widget build(BuildContext context) => const PlaceholderScreen(
        title: 'Store Locator',
        note: 'Map of nearby stores with hours and distance; set a saved store.',
      );
}
