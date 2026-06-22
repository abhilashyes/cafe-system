import 'dart:convert';
import 'package:http/http.dart' as http;

/// Thin client over the published `/v1` Brew APIs (brew-contracts).
/// The app consumes ONLY these documented endpoints — never backend internals.
class BrewApi {
  BrewApi({required this.baseUrl, this.accessToken});

  final String baseUrl;
  String? accessToken;

  Map<String, String> get _headers => {
        'content-type': 'application/json',
        if (accessToken != null) 'authorization': 'Bearer $accessToken',
      };

  // --- Identity (phone + OTP via Cognito) ---
  Future<void> startOtp(String phone) async {
    await http.post(Uri.parse('$baseUrl/v1/auth/otp/start'),
        headers: _headers, body: jsonEncode({'phone': phone}));
  }

  Future<void> verifyOtp(String phone, String code) async {
    final res = await http.post(Uri.parse('$baseUrl/v1/auth/otp/verify'),
        headers: _headers, body: jsonEncode({'phone': phone, 'code': code}));
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    accessToken = body['accessToken'] as String?;
  }

  // --- Catalog ---
  Future<List<dynamic>> storeMenu(String storeId) async {
    final res = await http.get(Uri.parse('$baseUrl/v1/stores/$storeId/menu'),
        headers: _headers);
    return jsonDecode(res.body) as List<dynamic>;
  }
}
