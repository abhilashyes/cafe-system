import 'package:flutter/foundation.dart';

import '../api/brew_api.dart';
import '../api/demo_api.dart';
import '../config.dart';
import '../models.dart';

/// Fully client-side demo (no backend) — set via --dart-define=BREW_DEMO=true.
const bool kDemoMode = bool.fromEnvironment('BREW_DEMO', defaultValue: false);

/// Single app-wide store (ChangeNotifier; no extra state package needed).
class AppState extends ChangeNotifier {
  final BrewApi api = kDemoMode ? DemoBrewApi() : BrewApi();
  final String storeId = defaultStoreId;

  String? phone;
  String? get customerId => phone; // demo: customer id == phone
  String? customerName;
  bool get isAuthed => api.accessToken != null;

  final List<CartLine> cart = [];
  String fulfilment = 'TAKEAWAY'; // or DINE_IN
  String? tableNumber;

  OrderDto? lastOrder;
  String? lastUpiIntent;
  LoyaltyDto? loyalty;

  // --- Auth ---
  Future<void> startOtp(String phoneNumber) async {
    phone = phoneNumber;
    await api.startOtp(phoneNumber);
  }

  Future<void> verifyOtp(String code) async {
    await api.verifyOtp(phone!, code);
    notifyListeners();
  }

  // --- Cart ---
  int get cartSubtotalPaise => cart.fold(0, (s, l) => s + l.linePaise);

  void addToCart(MenuItem item) {
    final existing = cart.where((l) => l.item.id == item.id).toList();
    if (existing.isNotEmpty) {
      existing.first.quantity++;
    } else {
      cart.add(CartLine(item, 1));
    }
    notifyListeners();
  }

  void changeQty(CartLine line, int delta) {
    line.quantity += delta;
    if (line.quantity <= 0) cart.remove(line);
    notifyListeners();
  }

  void clearCart() {
    cart.clear();
    notifyListeners();
  }

  // --- Checkout: place order + initiate UPI payment ---
  Future<OrderDto> placeOrderAndPay() async {
    final order = await api.createOrder(
      storeId: storeId,
      fulfilment: fulfilment,
      tableNumber: fulfilment == 'DINE_IN' ? tableNumber : null,
      customerId: customerId,
      customerName: customerName,
      items: cart.map((l) => (productId: l.item.id, quantity: l.quantity)).toList(),
    );
    lastUpiIntent = await api.createUpiPayment(
      orderId: order.id,
      storeId: storeId,
      amountPaise: order.grandTotalPaise,
    );
    lastOrder = order;
    cart.clear();
    notifyListeners();
    return order;
  }

  Future<OrderDto> refreshOrder() async {
    final updated = await api.getOrder(lastOrder!.id);
    lastOrder = updated;
    notifyListeners();
    return updated;
  }

  Future<void> refreshLoyalty() async {
    if (customerId == null) return;
    loyalty = await api.loyaltyAccount(customerId!);
    notifyListeners();
  }
}

/// Global instance (kept simple; swap for provider/riverpod if the app grows).
final appState = AppState();
