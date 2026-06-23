import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/query_views.dart';
import '../data/dashboard_service.dart';
import '../widgets/summary_card.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _service = DashboardService();
  late Future<Map<String, dynamic>> _future = _service.summary();

  Future<void> _refresh() async {
    setState(() => _future = _service.summary());
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done)
          return const LoadingView(message: 'Memuat dashboard...');
        if (snapshot.hasError)
          return ErrorView(
            message: snapshot.error.toString(),
            onRetry: _refresh,
          );
        final data = snapshot.data ?? {};
        final alerts = (data['low_stock_alerts'] as List?) ?? [];
        final recent = (data['recent_activities'] as List?) ?? [];
        return RefreshIndicator(
          onRefresh: _refresh,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                'Dashboard',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 14),
              SummaryCard(
                title: 'Total Produk',
                value: '${data['total_products'] ?? 0}',
                icon: Icons.inventory_2,
                color: AppColors.sky600,
              ),
              SummaryCard(
                title: 'Stok Masuk Hari Ini',
                value: '${data['total_inbound_today'] ?? 0}',
                icon: Icons.south_west,
                color: Colors.green,
              ),
              SummaryCard(
                title: 'Stok Keluar Hari Ini',
                value: '${data['total_outbound_today'] ?? 0}',
                icon: Icons.north_east,
                color: Colors.orange,
              ),
              SummaryCard(
                title: 'Alert Stok Rendah',
                value: '${alerts.length}',
                icon: Icons.warning_amber,
                color: Colors.red,
              ),
              const SizedBox(height: 12),
              Text(
                'Aktivitas Terbaru',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              if (recent.isEmpty)
                const EmptyView(title: 'Belum ada aktivitas')
              else
                ...recent.map((item) {
                  final map = item as Map<String, dynamic>;
                  final product = map['product'] is Map
                      ? map['product']['name']
                      : 'Produk';
                  return Card(
                    child: ListTile(
                      leading: Icon(
                        map['type'] == 'in'
                            ? Icons.add_circle_outline
                            : Icons.remove_circle_outline,
                      ),
                      title: Text(product?.toString() ?? 'Produk'),
                      subtitle: Text(
                        '${map['mutation_source'] ?? 'manual'} - ${map['status'] ?? '-'}',
                      ),
                      trailing: Text('${map['quantity'] ?? 0}'),
                    ),
                  );
                }),
            ],
          ),
        );
      },
    );
  }
}
