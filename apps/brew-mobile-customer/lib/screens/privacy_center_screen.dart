import 'package:flutter/material.dart';

/// DPDP Privacy Center (placeholder): manage consent, export, erasure.
class PrivacyCenterScreen extends StatelessWidget {
  const PrivacyCenterScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Privacy Center')),
      body: const Padding(
        padding: EdgeInsets.all(24),
        child: Text(
          'Manage consent per purpose (transactional / marketing / analytics), '
          'download your data, and request erasure — DPDP Act 2023.\n\n'
          'Placeholder — wires to /v1/privacy endpoints in a later pass.',
        ),
      ),
    );
  }
}
