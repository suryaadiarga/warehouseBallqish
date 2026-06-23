import '../../../core/network/api_client.dart';
import '../../../core/utils/api_parser.dart';

class TransferService {
  TransferService({ApiClient? api}) : _api = api ?? ApiClient();
  final ApiClient _api;

  Future<List<dynamic>> all({String? status}) async => dataList(
    await _api.get(
          '/stock-transfers',
          query: {if (status != null && status.isNotEmpty) 'status': status},
        )
        as Map<String, dynamic>,
  );

  Future<Map<String, dynamic>> show(int id) async =>
      dataMap(await _api.get('/stock-transfers/$id') as Map<String, dynamic>);

  Future<Map<String, dynamic>> create(Map<String, dynamic> body) async =>
      dataMap(
        await _api.post('/stock-transfers', body: body) as Map<String, dynamic>,
      );

  Future<Map<String, dynamic>> updateStatus(
    int id,
    String status, {
    int? receivedQuantity,
    String? note,
  }) async => dataMap(
    await _api.put(
          '/stock-transfers/$id/status',
          body: {
            'status': status,
            'received_quantity': receivedQuantity,
            'note': note,
          },
        )
        as Map<String, dynamic>,
  );

  Future<List<dynamic>> productStocks(int productId) async {
    final data = dataMap(
      await _api.get('/products/$productId/stocks') as Map<String, dynamic>,
    );
    return data['stocks'] is List ? data['stocks'] as List<dynamic> : [];
  }
}
