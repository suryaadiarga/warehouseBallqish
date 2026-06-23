import 'package:flutter/material.dart';

import '../../../core/widgets/query_views.dart';
import '../../transfers/screens/transfer_detail_screen.dart';
import '../data/notification_service.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  final _service = NotificationService();
  late Future<List<dynamic>> _future = _service.all();

  void _reload() => setState(() => _future = _service.all());

  Future<void> _open(Map<String, dynamic> item) async {
    if (item['read_at'] == null) {
      await _service.markRead(item['id'].toString());
    }
    final transferId = int.tryParse(item['transfer_id']?.toString() ?? '');
    if (!mounted || transferId == null) {
      _reload();
      return;
    }
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => TransferDetailScreen(transferId: transferId),
      ),
    );
    _reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifikasi'),
        actions: [
          TextButton(
            onPressed: () async {
              await _service.markAllRead();
              _reload();
            },
            child: const Text('Baca semua'),
          ),
        ],
      ),
      body: FutureBuilder<List<dynamic>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const LoadingView();
          }
          if (snapshot.hasError) {
            return ErrorView(
              message: snapshot.error.toString(),
              onRetry: _reload,
            );
          }
          final rows = snapshot.data ?? [];
          if (rows.isEmpty) {
            return const EmptyView(title: 'Belum ada notifikasi');
          }
          return RefreshIndicator(
            onRefresh: () async => _reload(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: rows.length,
              itemBuilder: (context, index) {
                final item = rows[index] as Map<String, dynamic>;
                final unread = item['read_at'] == null;
                return Card(
                  color: unread
                      ? Theme.of(context).colorScheme.primaryContainer
                      : null,
                  child: ListTile(
                    onTap: () => _open(item),
                    leading: Icon(
                      unread
                          ? Icons.notifications_active
                          : Icons.notifications_none,
                    ),
                    title: Text(
                      item['title']?.toString() ?? 'Pembaruan transfer',
                      style: TextStyle(
                        fontWeight: unread ? FontWeight.w800 : FontWeight.w600,
                      ),
                    ),
                    subtitle: Text(item['message']?.toString() ?? ''),
                    trailing: const Icon(Icons.chevron_right),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
