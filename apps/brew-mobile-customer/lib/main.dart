import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'screens/login_screen.dart';
import 'screens/menu_screen.dart';
import 'screens/cart_screen.dart';
import 'screens/order_tracking_screen.dart';
import 'screens/loyalty_screen.dart';
import 'screens/privacy_center_screen.dart';
import 'screens/store_locator_screen.dart';

void main() => runApp(const BrewApp());

/// Customer app (§5.1). Phase 0: placeholder screens wired for the brew-contracts
/// API client. Phone+OTP via Cognito, Razorpay checkout, loyalty, Privacy Center.
class BrewApp extends StatelessWidget {
  const BrewApp({super.key});

  @override
  Widget build(BuildContext context) {
    final router = GoRouter(
      initialLocation: '/login',
      routes: [
        GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
        GoRoute(path: '/menu', builder: (_, __) => const MenuScreen()),
        GoRoute(path: '/cart', builder: (_, __) => const CartScreen()),
        GoRoute(path: '/track', builder: (_, __) => const OrderTrackingScreen()),
        GoRoute(path: '/loyalty', builder: (_, __) => const LoyaltyScreen()),
        GoRoute(path: '/privacy', builder: (_, __) => const PrivacyCenterScreen()),
        GoRoute(path: '/stores', builder: (_, __) => const StoreLocatorScreen()),
      ],
    );

    return MaterialApp.router(
      title: 'Brew',
      theme: ThemeData(colorSchemeSeed: const Color(0xFF00704A), useMaterial3: true),
      routerConfig: router,
    );
  }
}
