import '../../categories/data/category_model.dart';

class Product {
  const Product({
    required this.id,
    required this.categoryId,
    required this.sku,
    required this.name,
    required this.stock,
    required this.minStockLevel,
    this.barcode,
    this.price,
    this.category,
  });

  final int id;
  final int categoryId;
  final String sku;
  final String name;
  final int stock;
  final int minStockLevel;
  final String? barcode;
  final num? price;
  final Category? category;

  factory Product.fromJson(Map<String, dynamic> json) => Product(
    id: json['id'] as int,
    categoryId: json['category_id'] as int,
    sku: json['sku']?.toString() ?? '',
    name: json['name']?.toString() ?? '',
    stock: json['stock'] as int? ?? 0,
    minStockLevel: json['min_stock_level'] as int? ?? 0,
    barcode: json['barcode']?.toString(),
    price: num.tryParse(json['price']?.toString() ?? ''),
    category: json['category'] is Map<String, dynamic>
        ? Category.fromJson(json['category'] as Map<String, dynamic>)
        : null,
  );
}
