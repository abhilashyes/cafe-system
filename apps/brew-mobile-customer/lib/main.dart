import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'state/app_state.dart';
import 'theme.dart';
import 'widgets/responsive_shell.dart';
import 'screens/login_screen.dart';
import 'screens/home_shell.dart';
import 'screens/cart_screen.dart';
import 'screens/tracking_screen.dart';
import 'screens/privacy_center_screen.dart';
import 'screens/store_locator_screen.dart';

void main() => runApp(const BrewApp());

/// The Brew Lab — customer app (§5.1). Bottom-nav shell (Home · Order · History ·
/// Rewards) wired to the brew-contracts `/v1` APIs.
class BrewApp extends StatelessWidget {
  const BrewApp({super.key});

  @override
  Widget build(BuildContext context) {
    final router = GoRouter(
      initialLocation: '/login',
      redirect: (context, gstate) {
        final loggingIn = gstate.matchedLocation == '/login';
        if (!appState.isAuthed) return loggingIn ? null : '/login';
        if (loggingIn) return '/app';
        return null;
      },
      refreshListenable: appState,
      routes: [
        GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
        GoRoute(path: '/app', builder: (_, __) => const HomeShell()),
        GoRoute(path: '/cart', builder: (_, __) => const CartScreen()),
        GoRoute(path: '/track', builder: (_, __) => const TrackingScreen()),
        GoRoute(path: '/privacy', builder: (_, __) => const PrivacyCenterScreen()),
        GoRoute(path: '/stores', builder: (_, __) => const StoreLocatorScreen()),
      ],
    );

    return MaterialApp.router(
      title: 'The Brew Lab',
      debugShowCheckedModeBanner: false,
      theme: buildBrewTheme(Brightness.light),
      darkTheme: buildBrewTheme(Brightness.dark),
      themeMode: ThemeMode.dark, // brand is dark-first
      routerConfig: router,
      // Adaptive: full-bleed on phones, centered phone-width canvas on web/desktop.
      builder: (context, child) => ResponsiveShell(child: child ?? const SizedBox.shrink()),
    );
  }
}
