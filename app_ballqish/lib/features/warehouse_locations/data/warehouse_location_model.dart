import '../../warehouses/data/warehouse_model.dart';

class WarehouseLocation {
  const WarehouseLocation({
    required this.id,
    required this.warehouseId,
    required this.code,
    required this.name,
    this.description,
    this.warehouse,
  });

  final int id;
  final int warehouseId;
  final String code;
  final String name;
  final String? description;
  final Warehouse? warehouse;

  factory WarehouseLocation.fromJson(Map<String, dynamic> json) =>
      WarehouseLocation(
        id: json['id'] as int,
        warehouseId: json['warehouse_id'] as int,
        code: json['code']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        description: json['description']?.toString(),
        warehouse: json['warehouse'] is Map<String, dynamic>
            ? Warehouse.fromJson(json['warehouse'] as Map<String, dynamic>)
            : null,
      );
}
