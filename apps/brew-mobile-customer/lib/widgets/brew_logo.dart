import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Brand logo mark: "{ }" braces in JetBrains Mono + "The Brew Lab" in Sora 800.
class BrewLogo extends StatelessWidget {
  const BrewLogo({super.key, this.size = 20});
  final double size;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('{ }',
            style: GoogleFonts.jetBrainsMono(
                fontWeight: FontWeight.w600, fontSize: size, color: scheme.primary)),
        const SizedBox(width: 6),
        Text('The Brew Lab', style: GoogleFonts.sora(fontWeight: FontWeight.w800, fontSize: size)),
      ],
    );
  }
}
