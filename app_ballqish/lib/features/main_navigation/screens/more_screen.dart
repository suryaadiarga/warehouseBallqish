import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/update/app_update_service.dart';
import '../../categories/screens/category_list_screen.dart';
import '../../products/screens/product_list_screen.dart';
import '../../warehouse_locations/screens/warehouse_location_list_screen.dart';
import '../../warehouses/screens/warehouse_list_screen.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final menus = [
      ('Produk', Icons.inventory_2_outlined, const ProductListScreen()),
      ('Kategori', Icons.category_outlined, const CategoryListScreen()),
      ('Gudang', Icons.warehouse_outlined, const WarehouseListScreen()),
      (
        'Rak & Lokasi',
        Icons.grid_view_outlined,
        const WarehouseLocationListScreen(),
      ),
    ];
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(4, 4, 4, 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Menu lainnya',
                style: TextStyle(
                  color: AppColors.slate900,
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
        ),
        Card(
          child: ListTile(
            leading: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.sky50,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.system_update, color: AppColors.sky600),
            ),
            title: const Text('Cek pembaruan'),
            subtitle: const Text('Unduh versi terbaru dari server Ballqish'),
            trailing: const Icon(
              Icons.chevron_right,
              color: AppColors.slate400,
            ),
            onTap: () => AppUpdateService().checkAndPrompt(
              context,
              showUpToDateMessage: true,
            ),
          ),
        ),
        ...menus.map(
          (menu) => Card(
            child: ListTile(
              leading: Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.sky50,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(menu.$2, color: AppColors.sky600),
              ),
              title: Text(menu.$1),
              trailing: const Icon(
                Icons.chevron_right,
                color: AppColors.slate400,
              ),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => Scaffold(
                    appBar: AppBar(title: Text(menu.$1)),
                    body: menu.$3,
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
