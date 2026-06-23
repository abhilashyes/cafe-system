import 'package:flutter/material.dart';

/// Adaptive layout wrapper applied app-wide via [MaterialApp.router]'s builder.
///
/// - Phones (< 700 dp): full-bleed, native app layout.
/// - Tablets / desktop / web (PWA): centers a phone-width canvas on a muted
///   backdrop so the experience stays focused and intentional in a browser.
///
/// Per-screen responsive grids (e.g. a multi-column menu) can layer on top of
/// this using [LayoutBuilder] / [MediaQuery] where it helps.
class ResponsiveShell extends StatelessWidget {
  const ResponsiveShell({super.key, required this.child});

  final Widget child;

  static const double _phoneBreakpoint = 700;
  static const double _canvasWidth = 480;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    if (width < _phoneBreakpoint) return child;

    return ColoredBox(
      color: const Color(0xFFEDEDED),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: _canvasWidth),
          child: Material(
            elevation: 2,
            clipBehavior: Clip.antiAlias,
            child: child,
          ),
        ),
      ),
    );
  }
}
