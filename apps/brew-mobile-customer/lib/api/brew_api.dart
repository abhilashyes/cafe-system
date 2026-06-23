import 'dart:convert';
import 'package:http/http.dart' as http;

import '../config.dart';
import '../models.dart';

/// Thin client over the published `/v1` Brew APIs (brew-contracts). The app
/// consumes ONLY these documented endpoints — never backend internals.
class BrewApi {
  BrewApi({String? baseUrl}) : baseUrl = baseUrl ?? apiBaseUrl;

  final String baseUrl;
  String? accessToken;

  Map<String, String> _headers({String? idempotencyKey}) => {
        'content-type': 'application/json',
        if (accessToken != null) 'authorization': 'Bearer $accessToken',
        if (idempotencyKey != null) 'idempotency-key': idempotencyKey,
      };

  Never _fail(String what, http.Response res) =>
      throw Exception('$what failed: ${res.statusCode} ${res.body}');

  // --- Identity (phone + OTP via Cognito; dev OTP is 000000) ---
  Future<void> startOtp(String phone) async {
    final res = await http.post(Uri.parse('$baseUrl/v1/auth/otp/start'),
        headers: _headers(), body: jsonEncode({'phone': phone}));
    if (res.statusCode >= 300) _fail('startOtp', res);
  }

  Future<void> verifyOtp(String phone, String code) async {
    final res = await http.post(Uri.parse('$baseUrl/v1/auth/otp/verify'),
        headers: _headers(), body: jsonEncode({'phone': phone, 'code': code}));
    if (res.statusCode >= 300) _fail('verifyOtp', res);
    accessToken = (jsonDecode(res.body) as Map<String, dynamic>)['accessToken'] as String?;
  }

  // --- Catalog ---
  Future<List<MenuItem>> storeMenu(String storeId) async {
    final res = await http.get(Uri.parse('$baseUrl/v1/stores/$storeId/menu'), headers: _headers());
    if (res.statusCode >= 300) _fail('storeMenu', res);
    return (jsonDecode(res.body) as List)
        .map((e) => MenuItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // --- Ordering ---
  Future<OrderDto> createOrder({
    required String storeId,
    required String fulfilment, // DINE_IN | TAKEAWAY
    String? tableNumber,
    String? scheduledFor,
    String? customerId,
    String? customerName,
    required List<({String productId, int quantity})> items,
  }) async {
    final body = {
      'storeId': storeId,
      'channel': 'MOBILE_PREORDER',
      'fulfilment': fulfilment,
      if (tableNumber != null) 'tableNumber': tableNumber,
      if (scheduledFor != null) 'scheduledFor': scheduledFor,
      if (customerId != null) 'customerId': customerId,
      if (customerName != null) 'customerName': customerName,
      'items': items.map((i) => {'productId': i.productId, 'quantity': i.quantity}).toList(),
    };
    final res = await http.post(Uri.parse('$baseUrl/v1/orders'),
        headers: _headers(idempotencyKey: _key()), body: jsonEncode(body));
    if (res.statusCode >= 300) _fail('createOrder', res);
    return OrderDto.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  Future<OrderDto> getOrder(String orderId) async {
    final res = await http.get(Uri.parse('$baseUrl/v1/orders/$orderId'), headers: _headers());
    if (res.statusCode >= 300) _fail('getOrder', res);
    return OrderDto.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  // --- Payments (UPI intent via Razorpay) ---
  /// Returns the UPI intent deep link to hand off to a UPI app.
  Future<String?> createUpiPayment({
    required String orderId,
    required String storeId,
    required int amountPaise,
  }) async {
    final res = await http.post(Uri.parse('$baseUrl/v1/payments'),
        headers: _headers(idempotencyKey: _key()),
        body: jsonEncode({
          'orderId': orderId,
          'storeId': storeId,
          'method': 'UPI_INTENT',
          'amountPaise': amountPaise,
        }));
    if (res.statusCode >= 300) _fail('createUpiPayment', res);
    return (jsonDecode(res.body) as Map<String, dynamic>)['upiIntent'] as String?;
  }

  // --- Loyalty ---
  Future<LoyaltyDto> loyaltyAccount(String customerId) async {
    final res = await http.get(Uri.parse('$baseUrl/v1/loyalty/accounts/$customerId'), headers: _headers());
    if (res.statusCode >= 300) _fail('loyaltyAccount', res);
    return LoyaltyDto.fromJson(jsonDecode(res.body) as Map<String, dynamic>);
  }

  String _key() => DateTime.now().microsecondsSinceEpoch.toString();
}
