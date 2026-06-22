import 'package:flutter/material.dart';
import '_placeholder.dart';

/// Live status: Received → In Progress → Ready → Picked up, with push.
class OrderTrackingScreen extends StatelessWidget {
  const OrderTrackingScreen({super.key});
  @override
  Widget build(BuildContext context) => const PlaceholderScreen(
        title: 'Order Tracking',
        note: 'Live order status with push notifications, synced from the '
            'KDS/Fulfilment service.',
        nextLabel: 'View loyalty',
        nextPath: '/loyalty',
      );
}
