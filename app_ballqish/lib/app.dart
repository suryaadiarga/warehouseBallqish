import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'core/analytics/analytics_service.dart';
import 'core/storage/token_storage.dart';
import 'core/theme/app_theme.dart';
import 'core/update/app_update_service.dart';
import 'features/auth/data/auth_service.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/main_navigation/screens/main_navigation_screen.dart';
import 'features/notifications/data/push_notification_service.dart';

class BallqishApp extends StatelessWidget {
  const BallqishApp({super.key});

  static final navigatorKey = GlobalKey<NavigatorState>();

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark.copyWith(
        statusBarColor: Colors.transparent,
        systemNavigationBarColor: AppColors.slate50,
      ),
      child: MaterialApp(
        navigatorKey: navigatorKey,
        title: 'Ballqish WMS',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        navigatorObservers: [AnalyticsService().observer],
        home: const SessionGate(),
      ),
    );
  }
}

class SessionGate extends StatefulWidget {
  const SessionGate({super.key});

  @override
  State<SessionGate> createState() => _SessionGateState();
}

class _SessionGateState extends State<SessionGate> {
  final _storage = TokenStorage();
  final _authService = AuthService();
  bool _loading = true;
  bool _authenticated = false;

  @override
  void initState() {
    super.initState();
    _checkSession();
  }

  Future<void> _checkSession() async {
    final token = await _storage.getToken();
    if (token == null) {
      _finishLoading();
      return;
    }

    try {
      await _authService.me();
      await PushNotificationService().syncDeviceToken();
      _authenticated = true;
    } catch (_) {
      await _storage.clear();
    }

    _finishLoading();
  }

  void _finishLoading() {
    if (!mounted) return;

    setState(() => _loading = false);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        AppUpdateService().checkAndPrompt(context);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: AppColors.sky600)),
      );
    }

    return _authenticated ? const MainNavigationScreen() : const LoginScreen();
  }
}
