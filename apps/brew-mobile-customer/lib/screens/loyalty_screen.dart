import 'package:flutter/material.dart';
import '_placeholder.dart';

/// Current tier (of 5), stars balance, progress to next tier, rewards.
class LoyaltyScreen extends StatelessWidget {
  const LoyaltyScreen({super.key});
  @override
  Widget build(BuildContext context) => const PlaceholderScreen(
        title: 'Loyalty',
        note: 'Current membership tier (of 5), stars balance, progress to next '
            'tier, and rewards available to redeem at checkout.',
        nextLabel: 'Privacy Center',
        nextPath: '/privacy',
      );
}
