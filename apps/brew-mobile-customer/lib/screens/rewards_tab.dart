import 'package:flutter/material.dart';

import 'loyalty_screen.dart';

/// Rewards tab — reuses the loyalty view (tier of 5, stars, progress).
class RewardsTab extends StatelessWidget {
  const RewardsTab({super.key});
  @override
  Widget build(BuildContext context) => const LoyaltyScreen();
}
