import 'package:flutter/material.dart';

import '../../auth/data/auth_service.dart';
import '../../auth/screens/login_screen.dart';
import '../../categories/screens/category_list_screen.dart';
import '../../dashboard/screens/dashboard_screen.dart';
import '../../inventory/screens/inventory_screen.dart';
import '../../products/screens/product_list_screen.dart';
import '../../warehouse_locations/screens/warehouse_location_list_screen.dart';
import '../../warehouses/screens/warehouse_list_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  final _auth = AuthService();
  var _index = 0;

  final _pages = const [
    DashboardScreen(),
    ProductListScreen(),
    CategoryListScreen(),
    WarehouseListScreen(),
    WarehouseLocationListScreen(),
    InventoryScreen(),
  ];

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
        title: const Text('Ballqish WMS'),
        actions: [
          IconButton(
            onPressed: _logout,
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
          ),
        ],
      ),
      body: _pages[_index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.inventory_2_outlined),
            selectedIcon: Icon(Icons.inventory_2),
            label: 'Produk',
          ),
          NavigationDestination(
            icon: Icon(Icons.category_outlined),
            selectedIcon: Icon(Icons.category),
            label: 'Kategori',
          ),
          NavigationDestination(
            icon: Icon(Icons.warehouse_outlined),
            selectedIcon: Icon(Icons.warehouse),
            label: 'Gudang',
          ),
          NavigationDestination(
            icon: Icon(Icons.grid_view_outlined),
            selectedIcon: Icon(Icons.grid_view),
            label: 'Lokasi',
          ),
          NavigationDestination(icon: Icon(Icons.swap_horiz), label: 'Stok'),
        ],
      ),
    );
  }
}
