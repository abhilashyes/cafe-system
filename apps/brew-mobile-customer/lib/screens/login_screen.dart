import 'package:flutter/material.dart';
import '_placeholder.dart';

/// Phone + OTP sign-in via Cognito (no password). OTP 000000 in dev.
class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});
  @override
  Widget build(BuildContext context) => const PlaceholderScreen(
        title: 'Sign in',
        note: 'Enter your phone number; verify the OTP sent via Cognito SMS. '
            'Refresh tokens are stored securely (Keychain/Keystore).',
        nextLabel: 'Continue to menu',
        nextPath: '/menu',
      );
}
