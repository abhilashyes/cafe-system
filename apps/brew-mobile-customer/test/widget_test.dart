import 'package:flutter_test/flutter_test.dart';
import 'package:brew_mobile_customer/main.dart';

void main() {
  testWidgets('app boots to the login screen', (tester) async {
    await tester.pumpWidget(const BrewApp());
    await tester.pumpAndSettle();
    expect(find.text('Sign in'), findsOneWidget);
  });
}
