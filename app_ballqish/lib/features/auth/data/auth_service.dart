import '../../../core/analytics/analytics_service.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/token_storage.dart';
import '../../notifications/data/push_notification_service.dart';

class AuthService {
  AuthService({
    ApiClient? apiClient,
    TokenStorage? tokenStorage,
    PushNotificationService? pushNotificationService,
    AnalyticsService? analyticsService,
  }) : _api = apiClient ?? ApiClient(),
       _storage = tokenStorage ?? TokenStorage(),
       _pushNotifications =
           pushNotificationService ?? PushNotificationService(),
       _analytics = analyticsService ?? AnalyticsService();

  final ApiClient _api;
  final TokenStorage _storage;
  final PushNotificationService _pushNotifications;
  final AnalyticsService _analytics;

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response =
        await _api.post('/login', body: {'email': email, 'password': password})
            as Map<String, dynamic>;
    final data = response['data'] as Map<String, dynamic>;
    final token = data['access_token'].toString();
    final user = data['user'] as Map<String, dynamic>;
    await _storage.saveSession(token, user);
    await _pushNotifications.syncDeviceToken();
    await _analytics.logLogin(user);
    return user;
  }

  Future<Map<String, dynamic>> me() async {
    final response = await _api.get('/me') as Map<String, dynamic>;
    return response['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>?> storedUser() => _storage.getUser();

  Future<void> logout() async {
    try {
      await _analytics.logLogout();
    } catch (_) {}

    try {
      await _pushNotifications.unregisterDeviceToken();
    } catch (_) {}

    try {
      await _api.post('/logout');
    } catch (_) {}

    await _storage.clear();
  }
}
