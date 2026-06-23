import 'package:flutter/material.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/query_views.dart';
import '../data/transfer_service.dart';

const transferStatusLabels = <String, String>{
  'pending': 'Pending',
  'approved': 'Disetujui',
  'in_transit': 'Dalam Perjalanan',
  'arrived': 'Sudah Sampai',
  'completed': 'Selesai',
  'rejected': 'Ditolak',
  'cancelled': 'Dibatalkan',
  'discrepancy': 'Ada Selisih',
};

class TransferDetailScreen extends StatefulWidget {
  const TransferDetailScreen({super.key, required this.transferId});
  final int transferId;

  @override
  State<TransferDetailScreen> createState() => _TransferDetailScreenState();
}

class _TransferDetailScreenState extends State<TransferDetailScreen> {
  final _service = TransferService();
  late Future<Map<String, dynamic>> _future = _service.show(widget.transferId);

  void _reload() => setState(() => _future = _service.show(widget.transferId));

  List<String> _actions(String status) => switch (status) {
    'pending' => ['approved', 'rejected', 'cancelled'],
    'approved' => ['in_transit', 'cancelled'],
    'in_transit' => ['arrived', 'discrepancy'],
    'arrived' => ['completed', 'discrepancy'],
    'discrepancy' => ['completed'],
    _ => [],
  };

  Future<void> _changeStatus(
    Map<String, dynamic> transfer,
    String status,
  ) async {
    final needsQuantity = status == 'completed' || status == 'discrepancy';
    final needsNote = const [
      'rejected',
      'cancelled',
      'discrepancy',
    ].contains(status);
    final quantity = TextEditingController(
      text: (transfer['received_quantity'] ?? transfer['quantity']).toString(),
    );
    final note = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Ubah ke ${transferStatusLabels[status]}?'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (needsQuantity)
                TextField(
                  controller: quantity,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Jumlah diterima',
                  ),
                ),
              if (needsQuantity && needsNote) const SizedBox(height: 12),
              if (needsNote)
                TextField(
                  controller: note,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: 'Catatan wajib'),
                ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Batal'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Konfirmasi'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    if (needsNote && note.text.trim().isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Catatan wajib diisi.')));
      }
      return;
    }
    try {
      await _service.updateStatus(
        widget.transferId,
        status,
        receivedQuantity: needsQuantity
            ? int.tryParse(quantity.text.trim())
            : null,
        note: note.text.trim(),
      );
      _reload();
    } on ApiException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detail Transfer')),
      body: FutureBuilder<Map<String, dynamic>>(
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
          final transfer = snapshot.data ?? {};
          final product = transfer['product'] as Map?;
          final fromWarehouse = transfer['from_warehouse'] as Map?;
          final toWarehouse = transfer['to_warehouse'] as Map?;
          final fromLocation = transfer['from_location'] as Map?;
          final toLocation = transfer['to_location'] as Map?;
          final histories = (transfer['histories'] as List?) ?? [];
          final status = transfer['status']?.toString() ?? 'pending';
          final actions = _actions(status);

          return RefreshIndicator(
            onRefresh: () async => _reload(),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          transfer['transfer_number']?.toString() ?? '-',
                          style: Theme.of(context).textTheme.titleLarge
                              ?.copyWith(fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 8),
                        Chip(
                          label: Text(transferStatusLabels[status] ?? status),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          '${product?['name'] ?? 'Produk'} • ${transfer['quantity'] ?? 0} unit',
                        ),
                        const Divider(height: 28),
                        Text(
                          '${fromWarehouse?['name'] ?? '-'} / ${fromLocation?['code'] ?? '-'}',
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 6),
                          child: Icon(Icons.arrow_downward, size: 18),
                        ),
                        Text(
                          '${toWarehouse?['name'] ?? '-'} / ${toLocation?['code'] ?? '-'}',
                        ),
                        if (transfer['received_quantity'] != null) ...[
                          const SizedBox(height: 12),
                          Text(
                            'Diterima: ${transfer['received_quantity']} unit',
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ],
                        if (transfer['discrepancy_note'] != null) ...[
                          const SizedBox(height: 8),
                          Text(
                            'Catatan selisih: ${transfer['discrepancy_note']}',
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Timeline',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 8),
                ...histories.map((raw) {
                  final history = raw as Map<String, dynamic>;
                  final user = history['user'] as Map?;
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const CircleAvatar(
                      child: Icon(Icons.check, size: 18),
                    ),
                    title: Text(
                      transferStatusLabels[history['to_status']] ??
                          history['to_status']?.toString() ??
                          '-',
                    ),
                    subtitle: Text(
                      '${user?['name'] ?? 'Sistem'}'
                      '${history['note'] == null ? '' : ' • ${history['note']}'}',
                    ),
                  );
                }),
                if (actions.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    'Tindakan',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  ...actions.map(
                    (action) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: FilledButton.tonal(
                        onPressed: () => _changeStatus(transfer, action),
                        child: Text(transferStatusLabels[action] ?? action),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}
