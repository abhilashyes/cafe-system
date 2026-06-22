import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../models.dart';
import '../state/app_state.dart';

/// Cart + checkout. Choose dine-in/takeaway, then place the order and start a
/// UPI payment (Razorpay intent). GST is computed server-side and shown on the
/// order total in tracking.
class CartScreen extends StatefulWidget {
  const CartScreen({super.key});
  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  bool _busy = false;
  String? _error;

  Future<void> _checkout() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await appState.placeOrderAndPay();
      if (mounted) context.go('/track');
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Your order')),
      body: ListenableBuilder(
        listenable: appState,
        builder: (context, _) {
          if (appState.cart.isEmpty) {
            return const Center(child: Text('Your cart is empty.'));
          }
          return Column(
            children: [
              Expanded(
                child: ListView(
                  children: [
                    for (final line in appState.cart)
                      ListTile(
                        title: Text(line.item.name),
                        subtitle: Text(formatPaise(line.item.pricePaise)),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(icon: const Icon(Icons.remove), onPressed: () => appState.changeQty(line, -1)),
                            Text('${line.quantity}'),
                            IconButton(icon: const Icon(Icons.add), onPressed: () => appState.changeQty(line, 1)),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
              const Divider(height: 1),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        const Text('Fulfilment:'),
                        const SizedBox(width: 12),
                        ChoiceChip(
                          label: const Text('Takeaway'),
                          selected: appState.fulfilment == 'TAKEAWAY',
                          onSelected: (_) {
                            appState.fulfilment = 'TAKEAWAY';
                            appState.tableNumber = null;
                            setState(() {});
                          },
                        ),
                        const SizedBox(width: 8),
                        ChoiceChip(
                          label: const Text('Dine-in'),
                          selected: appState.fulfilment == 'DINE_IN',
                          onSelected: (_) {
                            appState.fulfilment = 'DINE_IN';
                            setState(() {});
                          },
                        ),
                      ],
                    ),
                    if (appState.fulfilment == 'DINE_IN')
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: TextField(
                          decoration: const InputDecoration(labelText: 'Table number', isDense: true),
                          keyboardType: TextInputType.number,
                          onChanged: (v) => appState.tableNumber = v,
                        ),
                      ),
                    const SizedBox(height: 12),
                    Text('Subtotal (ex-GST): ${formatPaise(appState.cartSubtotalPaise)}',
                        style: const TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    if (_error != null) Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(_error!, style: const TextStyle(color: Colors.red)),
                    ),
                    FilledButton(
                      onPressed: _busy ? null : _checkout,
                      child: Text(_busy ? 'Placing…' : 'Place order & pay with UPI'),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
