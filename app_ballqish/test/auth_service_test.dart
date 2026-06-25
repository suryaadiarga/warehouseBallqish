import 'package:app_ballqish/core/analytics/analytics_service.dart';
import 'package:app_ballqish/core/network/api_client.dart';
import 'package:app_ballqish/core/storage/token_storage.dart';
import 'package:app_ballqish/features/auth/data/auth_service.dart';
import 'package:app_ballqish/features/notifications/data/push_notification_service.dart';
import 'package:flutter_test/flutter_test.dart';

class _FailingApiClient extends ApiClient {
  @override
  Future<dynamic> post(String path, {Map<String, dynamic>? body}) {
    throw Exception('Token server sudah tidak valid');
  }
}

class _TrackingTokenStorage extends TokenStorage {
  var cleared = false;

  @override
  Future<void> clear() async {
    cleared = true;
  }
}

class _FailingPushNotificationService extends PushNotificationService {
  @override
  Future<void> unregisterDeviceToken() {
    throw Exception('Token FCM tidak dapat dihapus dari server');
  }
}

class _FakeAnalyticsService extends AnalyticsService {
  @override
  Future<void> logLogout() async {}
}

void main() {
  test(
    'logout tetap membersihkan sesi lokal saat token server tidak valid',
    () async {
      final storage = _TrackingTokenStorage();
      final service = AuthService(
        apiClient: _FailingApiClient(),
        tokenStorage: storage,
        pushNotificationService: _FailingPushNotificationService(),
        analyticsService: _FakeAnalyticsService(),
      );

      await service.logout();

      expect(storage.cleared, isTrue);
    },
  );
}
