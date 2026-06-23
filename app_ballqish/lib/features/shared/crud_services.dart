import '../../core/network/api_client.dart';
import '../../core/utils/api_parser.dart';
import '../categories/data/category_model.dart';
import '../products/data/product_model.dart';
import '../warehouse_locations/data/warehouse_location_model.dart';
import '../warehouses/data/warehouse_model.dart';

class CategoryService {
  CategoryService({ApiClient? api}) : _api = api ?? ApiClient();
  final ApiClient _api;
  Future<List<Category>> all() async => dataList(
    await _api.get('/categories') as Map<String, dynamic>,
  ).cast<Map<String, dynamic>>().map(Category.fromJson).toList();
  Future<void> create(String name) =>
      _api.post('/categories', body: {'name': name});
  Future<void> update(int id, String name) =>
      _api.put('/categories/$id', body: {'name': name});
  Future<void> delete(int id) => _api.delete('/categories/$id');
}

class ProductService {
  ProductService({ApiClient? api}) : _api = api ?? ApiClient();
  final ApiClient _api;
  Future<List<Product>> all({String? search}) async => dataList(
    await _api.get(
          '/products',
          query: {
            if (search?.isNotEmpty ?? false) 'search': search,
            'per_page': 100,
          },
        )
        as Map<String, dynamic>,
  ).cast<Map<String, dynamic>>().map(Product.fromJson).toList();
  Future<void> create(Map<String, dynamic> body) =>
      _api.post('/products', body: body);
  Future<void> update(int id, Map<String, dynamic> body) =>
      _api.put('/products/$id', body: body);
  Future<void> delete(int id) => _api.delete('/products/$id');
}

class WarehouseService {
  WarehouseService({ApiClient? api}) : _api = api ?? ApiClient();
  final ApiClient _api;
  Future<List<Warehouse>> all() async => dataList(
    await _api.get('/warehouses') as Map<String, dynamic>,
  ).cast<Map<String, dynamic>>().map(Warehouse.fromJson).toList();
  Future<void> create(Map<String, dynamic> body) =>
      _api.post('/warehouses', body: body);
  Future<void> update(int id, Map<String, dynamic> body) =>
      _api.put('/warehouses/$id', body: body);
  Future<void> delete(int id) => _api.delete('/warehouses/$id');
}

class WarehouseLocationService {
  WarehouseLocationService({ApiClient? api}) : _api = api ?? ApiClient();
  final ApiClient _api;
  Future<List<WarehouseLocation>> all({int? warehouseId}) async => dataList(
    await _api.get(
          '/warehouse-locations',
          query: {
            ...warehouseId == null ? {} : {'warehouse_id': warehouseId},
          },
        )
        as Map<String, dynamic>,
  ).cast<Map<String, dynamic>>().map(WarehouseLocation.fromJson).toList();
  Future<void> create(Map<String, dynamic> body) =>
      _api.post('/warehouse-locations', body: body);
  Future<void> update(int id, Map<String, dynamic> body) =>
      _api.put('/warehouse-locations/$id', body: body);
  Future<void> delete(int id) => _api.delete('/warehouse-locations/$id');
}
