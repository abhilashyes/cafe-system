import 'package:flutter/material.dart';

/// Store locator (placeholder): map of stores, hours, distance; set saved store.
class StoreLocatorScreen extends StatelessWidget {
  const StoreLocatorScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Find a store')),
      body: const Padding(
        padding: EdgeInsets.all(24),
        child: Text(
          'Map of nearby stores with hours and distance; set a saved store.\n\n'
          'Placeholder — wires to /v1/stores in a later pass.',
        ),
      ),
    );
  }
}
