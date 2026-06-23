import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'state/app_state.dart';
import 'widgets/responsive_shell.dart';
import 'screens/login_screen.dart';
import 'screens/menu_screen.dart';
import 'screens/cart_screen.dart';
import 'screens/tracking_screen.dart';
import 'screens/loyalty_screen.dart';
import 'screens/privacy_center_screen.dart';
import 'screens/store_locator_screen.dart';

void main() => runApp(const BrewApp());

/// Customer app (§5.1). Vertical slice wired to the brew-contracts `/v1` APIs:
/// phone+OTP login → store menu → cart → place order + UPI payment → live
/// tracking → loyalty. Privacy Center & store locator are placeholders.
class BrewApp extends StatelessWidget {
  const BrewApp({super.key});

  @override
  Widget build(BuildContext context) {
    final router = GoRouter(
      initialLocation: '/login',
      // Gate the app behind auth; redirect to /login until signed in.
      redirect: (context, gstate) {
        final loggingIn = gstate.matchedLocation == '/login';
        if (!appState.isAuthed) return loggingIn ? null : '/login';
        if (loggingIn) return '/menu';
        return null;
      },
      refreshListenable: appState,
      routes: [
        GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
        GoRoute(path: '/menu', builder: (_, __) => const MenuScreen()),
        GoRoute(path: '/cart', builder: (_, __) => const CartScreen()),
        GoRoute(path: '/track', builder: (_, __) => const TrackingScreen()),
        GoRoute(path: '/loyalty', builder: (_, __) => const LoyaltyScreen()),
        GoRoute(path: '/privacy', builder: (_, __) => const PrivacyCenterScreen()),
        GoRoute(path: '/stores', builder: (_, __) => const StoreLocatorScreen()),
      ],
    );

    return MaterialApp.router(
      title: 'Brew',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(colorSchemeSeed: const Color(0xFF00704A), useMaterial3: true),
      routerConfig: router,
      // Adaptive: full-bleed on phones, centered phone-width canvas on web/desktop.
      builder: (context, child) => ResponsiveShell(child: child ?? const SizedBox.shrink()),
    );
  }
}
