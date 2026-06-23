import 'package:flutter/material.dart';

/// The Brew Lab — brand palette (dark + light tokens).
class BrewColors {
  // Dark
  static const bgDark = Color(0xFF0F1117);
  static const surfaceDark = Color(0xFF161A22);
  static const cardDark = Color(0xFF1B202B);
  static const accentDark = Color(0xFFA78BFA);
  static const accentAltDark = Color(0xFF7DD3FC);
  static const champagneDark = Color(0xFFE9CBA7);
  static const roseDark = Color(0xFFF4A8C5);
  static const textDark = Color(0xFFF5F7FA);
  static const textMutedDark = Color(0xFF98A1B2);
  static const onAccentDark = Color(0xFF0F1117);

  // Light
  static const bgLight = Color(0xFFFAFAFC);
  static const surfaceLight = Color(0xFFF4F5F8);
  static const cardLight = Color(0xFFFFFFFF);
  static const accentLight = Color(0xFF7C5CFA);
  static const accentAltLight = Color(0xFF0891B2);
  static const champagneLight = Color(0xFFB07B4E);
  static const roseLight = Color(0xFFDB7093);
  static const textLight = Color(0xFF1A1D26);
  static const textMutedLight = Color(0xFF6B7280);
  static const onAccentLight = Color(0xFFFFFFFF);

  /// Warm tertiary used for prices/amounts.
  static Color champagne(BuildContext c) =>
      Theme.of(c).brightness == Brightness.dark ? champagneDark : champagneLight;
}

ThemeData buildBrewTheme(Brightness brightness) {
  final dark = brightness == Brightness.dark;
  final scheme = ColorScheme(
    brightness: brightness,
    primary: dark ? BrewColors.accentDark : BrewColors.accentLight,
    onPrimary: dark ? BrewColors.onAccentDark : BrewColors.onAccentLight,
    secondary: dark ? BrewColors.accentAltDark : BrewColors.accentAltLight,
    onSecondary: dark ? BrewColors.onAccentDark : BrewColors.onAccentLight,
    tertiary: dark ? BrewColors.roseDark : BrewColors.roseLight,
    onTertiary: dark ? BrewColors.onAccentDark : BrewColors.onAccentLight,
    error: dark ? BrewColors.roseDark : BrewColors.roseLight,
    onError: dark ? BrewColors.onAccentDark : BrewColors.onAccentLight,
    surface: dark ? BrewColors.surfaceDark : BrewColors.surfaceLight,
    onSurface: dark ? BrewColors.textDark : BrewColors.textLight,
  );

  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: scheme,
    scaffoldBackgroundColor: dark ? BrewColors.bgDark : BrewColors.bgLight,
    cardColor: dark ? BrewColors.cardDark : BrewColors.cardLight,
    appBarTheme: AppBarTheme(
      backgroundColor: dark ? BrewColors.surfaceDark : BrewColors.surfaceLight,
      foregroundColor: dark ? BrewColors.textDark : BrewColors.textLight,
      elevation: 0,
    ),
  );
}
