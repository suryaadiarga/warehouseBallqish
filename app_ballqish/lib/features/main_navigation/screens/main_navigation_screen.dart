import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../auth/data/auth_service.dart';
import '../../auth/screens/login_screen.dart';
import '../../dashboard/screens/dashboard_screen.dart';
import '../../inventory/screens/inventory_screen.dart';
import '../../notifications/data/notification_service.dart';
import '../../notifications/screens/notification_screen.dart';
import '../../transfers/screens/transfer_list_screen.dart';
import 'more_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  final _auth = AuthService();
  final _notifications = NotificationService();
  var _index = 0;
  var _unreadNotifications = 0;
  Timer? _notificationTimer;

  final _pages = const [
    DashboardScreen(),
    InventoryScreen(),
    TransferListScreen(),
    MoreScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _loadUnreadNotifications();
    _notificationTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => _loadUnreadNotifications(),
    );
  }

  @override
  void dispose() {
    _notificationTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadUnreadNotifications() async {
    try {
      final rows = await _notifications.all();
      final unread = rows.where((item) {
        if (item is! Map<String, dynamic>) return false;
        return item['read_at'] == null;
      }).length;
      if (!mounted) return;
      setState(() => _unreadNotifications = unread);
    } catch (_) {
      if (!mounted) return;
      setState(() => _unreadNotifications = 0);
    }
  }

  Future<void> _logout() async {
    await _auth.logout();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.warehouse_outlined, color: AppColors.sky600, size: 25),
            SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'BALLQISH',
                  style: TextStyle(
                    color: AppColors.slate400,
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 2,
                    height: 1,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Warehouse Management System',
                  style: TextStyle(
                    color: AppColors.slate900,
                    fontSize: 17,
                    fontWeight: FontWeight.w900,
                    height: 1,
                  ),
                ),
              ],
            ),
          ],
        ),
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(1),
          child: Divider(height: 1, color: AppColors.slate200),
        ),
        actions: [
          IconButton(
            onPressed: () async {
              await Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const NotificationScreen()),
              );
              _loadUnreadNotifications();
            },
            icon: Badge.count(
              count: _unreadNotifications,
              isLabelVisible: _unreadNotifications > 0,
              child: const Icon(
                Icons.notifications_outlined,
                color: AppColors.slate700,
              ),
            ),
            tooltip: 'Notifikasi',
          ),
          IconButton(
            onPressed: _logout,
            icon: const Icon(Icons.logout, color: Color(0xFFE11D48)),
            tooltip: 'Logout',
          ),
        ],
      ),
      body: _pages[_index],
      bottomNavigationBar: DecoratedBox(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppColors.slate200)),
        ),
        child: NavigationBar(
          selectedIndex: _index,
          onDestinationSelected: (value) => setState(() => _index = value),
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.dashboard_outlined),
              selectedIcon: Icon(Icons.dashboard),
              label: 'Dashboard',
            ),
            NavigationDestination(icon: Icon(Icons.swap_horiz), label: 'Stok'),
            NavigationDestination(
              icon: Icon(Icons.local_shipping_outlined),
              selectedIcon: Icon(Icons.local_shipping),
              label: 'Transfer',
            ),
            NavigationDestination(
              icon: Icon(Icons.more_horiz),
              label: 'Lainnya',
            ),
          ],
        ),
      ),
    );
  }
}
