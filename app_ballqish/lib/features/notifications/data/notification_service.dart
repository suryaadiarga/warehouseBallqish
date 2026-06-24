import '../../../core/network/api_client.dart';
import '../../../core/utils/api_parser.dart';

class NotificationService {
  NotificationService({ApiClient? api}) : _api = api ?? ApiClient();
  final ApiClient _api;

  Future<List<dynamic>> all() async =>
      dataList(await _api.get('/notifications') as Map<String, dynamic>);

  Future<void> markRead(String id) => _api.put('/notifications/$id/read');

  Future<void> markAllRead() => _api.put('/notifications/read-all');

  Future<void> registerDeviceToken({
    required String token,
    required String platform,
  }) =>
      _api.post('/device-tokens', body: {'token': token, 'platform': platform});

  Future<void> unregisterDeviceToken(String token) =>
      _api.delete('/device-tokens', body: {'token': token});
}
