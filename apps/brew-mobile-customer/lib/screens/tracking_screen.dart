import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../models.dart';
import '../state/app_state.dart';

const _steps = ['RECEIVED', 'IN_PROGRESS', 'READY', 'PICKED_UP'];

/// Live order tracking. Polls order status (a full build would use push /
/// WebSocket). Shows the pickup code and the UPI intent to complete payment.
class TrackingScreen extends StatefulWidget {
  const TrackingScreen({super.key});
  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> {
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    if (appState.lastOrder != null) {
      _poll = Timer.periodic(const Duration(seconds: 4), (_) async {
        try {
          await appState.refreshOrder();
        } catch (_) {/* keep polling */}
      });
    }
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Order status')),
      body: ListenableBuilder(
        listenable: appState,
        builder: (context, _) {
          final order = appState.lastOrder;
          if (order == null) {
            return const Center(child: Text('No active order.'));
          }
          final currentIdx = _steps.indexOf(order.status);
          return Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Pickup code', style: Theme.of(context).textTheme.labelMedium),
                Text(order.pickupCode, style: const TextStyle(fontSize: 40, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text('Total: ${formatPaise(order.grandTotalPaise)} (incl. GST)'),
                const SizedBox(height: 24),
                for (var i = 0; i < _steps.length; i++)
                  ListTile(
                    leading: Icon(
                      i <= currentIdx ? Icons.check_circle : Icons.radio_button_unchecked,
                      color: i <= currentIdx ? Colors.green : Colors.grey,
                    ),
                    title: Text(_steps[i].replaceAll('_', ' ')),
                  ),
                const Spacer(),
                if (appState.lastUpiIntent != null)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Complete payment', style: TextStyle(fontWeight: FontWeight.bold)),
                          const Text('Open your UPI app (GPay/PhonePe/Paytm) to pay:'),
                          const SizedBox(height: 4),
                          SelectableText(appState.lastUpiIntent!, style: const TextStyle(fontSize: 12)),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 12),
                OutlinedButton(onPressed: () => context.go('/app'), child: const Text('Back to ordering')),
              ],
            ),
          );
        },
      ),
    );
  }
}
