import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';

import '../../transfers/screens/transfer_detail_screen.dart';
import 'notification_service.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {
    // Firebase is optional until the project is configured.
  }
}

class PushNotificationService {
  PushNotificationService({NotificationService? notificationService})
    : _notificationService = notificationService ?? NotificationService();

  static var _enabled = false;
  static var _tokenRefreshRegistered = false;
  final NotificationService _notificationService;

  static Future<void> initialize() async {
    try {
      await Firebase.initializeApp();
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
      await FirebaseMessaging.instance
          .setForegroundNotificationPresentationOptions(
            alert: true,
            badge: true,
            sound: true,
          );
      _enabled = true;
    } catch (_) {
      _enabled = false;
    }
  }

  static void setupMessageOpenedHandler(
    GlobalKey<NavigatorState> navigatorKey,
  ) {
    if (!_enabled) return;

    FirebaseMessaging.onMessageOpenedApp.listen(
      (message) => _openTransferFromMessage(navigatorKey, message),
    );

    FirebaseMessaging.instance.getInitialMessage().then((message) {
      if (message != null) {
        _openTransferFromMessage(navigatorKey, message);
      }
    });
  }

  Future<void> syncDeviceToken() async {
    if (!_enabled) return;

    try {
      await FirebaseMessaging.instance.requestPermission();
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await _notificationService.registerDeviceToken(
          token: token,
          platform: _platform,
        );
      }

      if (!_tokenRefreshRegistered) {
        _tokenRefreshRegistered = true;
        FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
          _notificationService.registerDeviceToken(
            token: newToken,
            platform: _platform,
          );
        });
      }
    } catch (_) {
      // Push is best-effort; database notifications and polling remain active.
    }
  }

  Future<void> unregisterDeviceToken() async {
    if (!_enabled) return;

    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await _notificationService.unregisterDeviceToken(token);
      }
    } catch (_) {
      // Logout must not fail because push unregister failed.
    }
  }

  static void _openTransferFromMessage(
    GlobalKey<NavigatorState> navigatorKey,
    RemoteMessage message,
  ) {
    final transferId = int.tryParse(
      message.data['transfer_id']?.toString() ?? '',
    );
    if (transferId == null) return;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final navigator = navigatorKey.currentState;
      if (navigator == null) return;
      navigator.push(
        MaterialPageRoute(
          builder: (_) => TransferDetailScreen(transferId: transferId),
        ),
      );
    });
  }

  String get _platform {
    if (Platform.isAndroid) return 'android';
    if (Platform.isIOS) return 'ios';
    return 'unknown';
  }
}
