import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

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

  /// Prices/amounts render in JetBrains Mono (brand rule).
  static TextStyle price(BuildContext c, {double size = 14}) => GoogleFonts.jetBrainsMono(
        color: champagne(c),
        fontWeight: FontWeight.w600,
        fontSize: size,
      );

  /// Mono kicker/label style (// labels, codes).
  static TextStyle mono(BuildContext c, {double size = 12, Color? color}) =>
      GoogleFonts.jetBrainsMono(fontSize: size, color: color);
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

  final onSurface = dark ? BrewColors.textDark : BrewColors.textLight;
  // Body text: Manrope. Headings/titles: Sora.
  final body = GoogleFonts.manropeTextTheme(
    (dark ? ThemeData.dark() : ThemeData.light()).textTheme,
  );
  TextStyle sora(TextStyle? base, FontWeight w) => GoogleFonts.sora(textStyle: base, fontWeight: w);
  final textTheme = body.copyWith(
    displayLarge: sora(body.displayLarge, FontWeight.w800),
    displayMedium: sora(body.displayMedium, FontWeight.w700),
    displaySmall: sora(body.displaySmall, FontWeight.w700),
    headlineLarge: sora(body.headlineLarge, FontWeight.w700),
    headlineMedium: sora(body.headlineMedium, FontWeight.w700),
    headlineSmall: sora(body.headlineSmall, FontWeight.w700),
    titleLarge: sora(body.titleLarge, FontWeight.w700),
  );

  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: scheme,
    scaffoldBackgroundColor: dark ? BrewColors.bgDark : BrewColors.bgLight,
    cardColor: dark ? BrewColors.cardDark : BrewColors.cardLight,
    textTheme: textTheme,
    appBarTheme: AppBarTheme(
      backgroundColor: dark ? BrewColors.surfaceDark : BrewColors.surfaceLight,
      foregroundColor: onSurface,
      elevation: 0,
      titleTextStyle: GoogleFonts.sora(fontWeight: FontWeight.w700, fontSize: 20, color: onSurface),
    ),
  );
}
