import '../../../core/network/api_client.dart';
import '../../../core/utils/api_parser.dart';

class InventoryService {
  InventoryService({ApiClient? api}) : _api = api ?? ApiClient();
  final ApiClient _api;

  Future<List<dynamic>> productStocks() async => dataList(
    await _api.get('/product-stocks', query: {'per_page': 100})
        as Map<String, dynamic>,
  );

  Future<List<dynamic>> reports() async =>
      dataList(await _api.get('/reports/mutations') as Map<String, dynamic>);

  Future<void> createMutation(Map<String, dynamic> body) =>
      _api.post('/mutations', body: body);

  Future<void> createInventoryMovement(Map<String, dynamic> body) =>
      _api.post('/inventory-movements', body: body);

  Future<void> approveMutation(int id) => _api.put('/mutations/$id/approve');

  Future<void> createTransfer(Map<String, dynamic> body) =>
      _api.post('/stock-transfers', body: body);

  Future<void> createAdjustment(Map<String, dynamic> body) =>
      _api.post('/stock-adjustments', body: body);
}
