import '../../../core/network/api_client.dart';
import '../../../core/utils/api_parser.dart';

class DashboardService {
  DashboardService({ApiClient? api}) : _api = api ?? ApiClient();
  final ApiClient _api;

  Future<Map<String, dynamic>> summary() async =>
      dataMap(await _api.get('/dashboard') as Map<String, dynamic>);
}
