import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../state/app_state.dart';

/// Phone + OTP sign-in via Cognito (no password). Dev OTP is 000000.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phone = TextEditingController(text: '+919999999999');
  final _code = TextEditingController();
  bool _otpSent = false;
  bool _busy = false;
  String? _error;

  Future<void> _run(Future<void> Function() action) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await action();
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sign in')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Welcome to The Brew Lab', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text('Sign in with your phone number — we’ll text you a code.'),
            const SizedBox(height: 16),
            TextField(
              controller: _phone,
              enabled: !_otpSent,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Phone number', border: OutlineInputBorder()),
            ),
            if (_otpSent) ...[
              const SizedBox(height: 12),
              TextField(
                controller: _code,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'OTP (dev: 000000)', border: OutlineInputBorder()),
              ),
            ],
            const SizedBox(height: 16),
            if (_error != null) Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(_error!, style: const TextStyle(color: Colors.red)),
            ),
            FilledButton(
              onPressed: _busy
                  ? null
                  : () {
                      if (!_otpSent) {
                        _run(() async {
                          await appState.startOtp(_phone.text.trim());
                          setState(() => _otpSent = true);
                        });
                      } else {
                        _run(() async {
                          await appState.verifyOtp(_code.text.trim());
                          if (context.mounted) context.go('/app');
                        });
                      }
                    },
              child: Text(_busy ? 'Please wait…' : (_otpSent ? 'Verify & continue' : 'Send OTP')),
            ),
          ],
        ),
      ),
    );
  }
}
