import 'package:flutter/material.dart';
import '_placeholder.dart';

/// DPDP Privacy Center: view/download/delete data, manage marketing consent.
class PrivacyCenterScreen extends StatelessWidget {
  const PrivacyCenterScreen({super.key});
  @override
  Widget build(BuildContext context) => const PlaceholderScreen(
        title: 'Privacy Center',
        note: 'Manage consent per purpose (transactional/marketing/analytics), '
            'view/download your data, and request erasure — DPDP Act 2023.',
        nextLabel: 'Find a store',
        nextPath: '/stores',
      );
}
