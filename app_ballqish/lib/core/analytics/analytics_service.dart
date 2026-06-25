import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/widgets.dart';

class AnalyticsService {
  AnalyticsService({FirebaseAnalytics? analytics}) : _analytics = analytics;

  FirebaseAnalytics? _analytics;

  FirebaseAnalytics? get _instance {
    if (_analytics != null) return _analytics;
    if (Firebase.apps.isEmpty) return null;
    return _analytics = FirebaseAnalytics.instance;
  }

  NavigatorObserver get observer {
    final analytics = _instance;
    return analytics == null
        ? NavigatorObserver()
        : FirebaseAnalyticsObserver(analytics: analytics);
  }

  Future<void> logLogin(Map<String, dynamic> user) async {
    final analytics = _instance;
    if (analytics == null) return;

    await analytics.setUserId(id: user['id']?.toString());
    await analytics.setUserProperty(
      name: 'user_role',
      value: user['role']?.toString(),
    );
    await analytics.logLogin(loginMethod: 'email');
  }

  Future<void> logLogout() async {
    final analytics = _instance;
    if (analytics == null) return;

    await analytics.logEvent(name: 'logout');
    await analytics.setUserId(id: null);
    await analytics.setUserProperty(name: 'user_role', value: null);
  }

  Future<void> logScreen(String screenName) async {
    final analytics = _instance;
    if (analytics == null) return;

    await analytics.logScreenView(
      screenName: screenName,
      screenClass: screenName,
    );
  }
}
