/// Lightweight DTOs mirroring the brew-contracts shapes the app consumes.

String formatPaise(int paise) => '₹${(paise / 100).toStringAsFixed(2)}';

class MenuItem {
  MenuItem({
    required this.id,
    required this.name,
    required this.category,
    required this.station,
    required this.pricePaise,
    required this.available,
  });

  final String id;
  final String name;
  final String category;
  final String station;
  final int pricePaise;
  final bool available;

  factory MenuItem.fromJson(Map<String, dynamic> j) => MenuItem(
        id: j['id'] as String,
        name: j['name'] as String,
        category: (j['category'] ?? '') as String,
        station: (j['station'] ?? 'BAR') as String,
        // Menu items carry a store-resolved pricePaise; fall back to base price.
        pricePaise: (j['pricePaise'] ?? j['basePricePaise'] ?? 0) as int,
        available: (j['available'] ?? true) as bool,
      );
}

class CartLine {
  CartLine(this.item, this.quantity);
  final MenuItem item;
  int quantity;
  int get linePaise => item.pricePaise * quantity;
}

class OrderDto {
  OrderDto({
    required this.id,
    required this.pickupCode,
    required this.status,
    required this.grandTotalPaise,
  });

  final String id;
  final String pickupCode;
  final String status;
  final int grandTotalPaise;

  factory OrderDto.fromJson(Map<String, dynamic> j) => OrderDto(
        id: j['id'] as String,
        pickupCode: (j['pickupCode'] ?? '') as String,
        status: (j['status'] ?? 'RECEIVED') as String,
        grandTotalPaise: ((j['totals']?['grandTotalPaise']) ?? 0) as int,
      );
}

class LoyaltyDto {
  LoyaltyDto({required this.tierId, required this.balanceStars, required this.qualifyingSpend});
  final String tierId;
  final int balanceStars;
  final int qualifyingSpend;

  factory LoyaltyDto.fromJson(Map<String, dynamic> j) => LoyaltyDto(
        tierId: (j['tierId'] ?? 't1') as String,
        balanceStars: (j['balanceStars'] ?? 0) as int,
        qualifyingSpend: (j['qualifyingSpend'] ?? 0) as int,
      );
}
