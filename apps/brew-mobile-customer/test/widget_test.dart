import 'package:flutter_test/flutter_test.dart';
import 'package:brew_mobile_customer/main.dart';

void main() {
  testWidgets('app boots to the login screen when unauthenticated', (tester) async {
    await tester.pumpWidget(const BrewApp());
    await tester.pump(); // let the router resolve the initial redirect

    // The unauthenticated app gates to /login (AppBar title + CTA).
    expect(find.text('Sign in'), findsOneWidget);
    expect(find.text('Send OTP'), findsOneWidget);
  });
}
