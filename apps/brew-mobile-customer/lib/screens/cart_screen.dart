import 'package:flutter/material.dart';
import '_placeholder.dart';

/// Cart + Razorpay checkout (UPI intent / cards / wallets), GST receipt.
class CartScreen extends StatelessWidget {
  const CartScreen({super.key});
  @override
  Widget build(BuildContext context) => const PlaceholderScreen(
        title: 'Cart & Checkout',
        note: 'Review items, redeem loyalty stars, pay via Razorpay (opens '
            'GPay/PhonePe/Paytm for UPI). GST-compliant receipt issued.',
        nextLabel: 'Track order',
        nextPath: '/track',
      );
}
