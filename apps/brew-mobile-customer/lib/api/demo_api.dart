import 'brew_api.dart';
import '../models.dart';

/// Fully client-side BrewApi for the GitHub Pages demo (no backend).
/// Enabled via --dart-define=BREW_DEMO=true.
class DemoBrewApi extends BrewApi {
  DemoBrewApi() : super(baseUrl: 'demo');

  // Demo catalog across several categories so the Order screen reads well.
  static final List<MenuItem> _menu = [
    MenuItem(id: 'prod_latte', name: 'Caffè Latte', category: 'Hot Coffee', station: 'BAR', pricePaise: 25000, available: true),
    MenuItem(id: 'prod_capp', name: 'Cappuccino', category: 'Hot Coffee', station: 'BAR', pricePaise: 24000, available: true),
    MenuItem(id: 'prod_flatwhite', name: 'Flat White', category: 'Hot Coffee', station: 'BAR', pricePaise: 26000, available: true),
    MenuItem(id: 'prod_icedlatte', name: 'Iced Latte', category: 'Cold Coffee', station: 'BAR', pricePaise: 27000, available: true),
    MenuItem(id: 'prod_coldbrew', name: 'Cold Brew', category: 'Cold Coffee', station: 'BAR', pricePaise: 28000, available: true),
    MenuItem(id: 'prod_berry', name: 'Berry Refresher', category: 'Refreshers', station: 'BAR', pricePaise: 29000, available: true),
    MenuItem(id: 'prod_mango', name: 'Mango Refresher', category: 'Refreshers', station: 'BAR', pricePaise: 29000, available: true),
    MenuItem(id: 'prod_protein', name: 'Protein Latte', category: 'Protein Beverages', station: 'BAR', pricePaise: 32000, available: true),
    MenuItem(id: 'prod_croissant', name: 'Butter Croissant', category: 'Bakery', station: 'BAKERY', pricePaise: 18000, available: true),
    MenuItem(id: 'prod_muffin', name: 'Choco Muffin', category: 'Bakery', station: 'BAKERY', pricePaise: 20000, available: true),
  ];
  static final Map<String, int> _prices = {for (final m in _menu) m.id: m.pricePaise};

  final Map<String, int> _polls = {}; // orderId → poll count (status progression)
  final Map<String, int> _totals = {}; // orderId → grand total (paise)

  @override
  Future<void> startOtp(String phone) async {}

  @override
  Future<void> verifyOtp(String phone, String code) async {
    accessToken = 'demo-token';
  }

  @override
  Future<List<MenuItem>> storeMenu(String storeId) async => _menu;

  @override
  Future<OrderDto> createOrder({
    required String storeId,
    required String fulfilment,
    String? tableNumber,
    String? scheduledFor,
    String? customerId,
    String? customerName,
    required List<({String productId, int quantity})> items,
  }) async {
    final subtotal = items.fold(0, (s, i) => s + (_prices[i.productId] ?? 0) * i.quantity);
    final grand = subtotal + (subtotal * 0.05).round();
    final id = DateTime.now().microsecondsSinceEpoch.toString();
    _totals[id] = grand;
    return OrderDto(id: id, pickupCode: id.substring(id.length - 4), status: 'RECEIVED', grandTotalPaise: grand);
  }

  @override
  Future<String?> createUpiPayment({required String orderId, required String storeId, required int amountPaise}) async =>
      'upi://pay?pa=brew@upi&am=${(amountPaise / 100).toStringAsFixed(2)}&tn=$orderId';

  @override
  Future<OrderDto> getOrder(String orderId) async {
    // Advance the status on each poll so tracking visibly progresses.
    final n = (_polls[orderId] ?? 0) + 1;
    _polls[orderId] = n;
    const flow = ['RECEIVED', 'IN_PROGRESS', 'READY', 'PICKED_UP'];
    final status = flow[n.clamp(0, flow.length - 1)];
    return OrderDto(id: orderId, pickupCode: orderId.substring(orderId.length - 4), status: status, grandTotalPaise: _totals[orderId] ?? 0);
  }

  @override
  Future<LoyaltyDto> loyaltyAccount(String customerId) async =>
      LoyaltyDto(tierId: 't2', balanceStars: 45, qualifyingSpend: 60000);
}
