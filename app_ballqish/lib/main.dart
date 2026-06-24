import 'package:flutter/material.dart';

import 'app.dart';
import 'features/notifications/data/push_notification_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await PushNotificationService.initialize();
  PushNotificationService.setupMessageOpenedHandler(BallqishApp.navigatorKey);
  runApp(const BallqishApp());
}
