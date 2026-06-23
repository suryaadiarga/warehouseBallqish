import 'package:flutter/material.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/confirm_dialog.dart';
import '../../../core/widgets/query_views.dart';
import '../../shared/crud_services.dart';
import '../data/warehouse_model.dart';

class WarehouseListScreen extends StatefulWidget {
  const WarehouseListScreen({super.key});

  @override
  State<WarehouseListScreen> createState() => _WarehouseListScreenState();
}

class _WarehouseListScreenState extends State<WarehouseListScreen> {
  final _service = WarehouseService();
  late Future<List<Warehouse>> _future = _service.all();

  void _reload() => setState(() => _future = _service.all());

  Future<void> _showForm({Warehouse? warehouse}) async {
    final name = TextEditingController(text: warehouse?.name ?? '');
    final location = TextEditingController(text: warehouse?.location ?? '');
    final save = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(warehouse == null ? 'Tambah Gudang' : 'Edit Gudang'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: name,
                decoration: const InputDecoration(labelText: 'Nama gudang'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: location,
                decoration: const InputDecoration(labelText: 'Lokasi'),
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
            child: Text(warehouse == null ? 'Tambah' : 'Simpan Perubahan'),
          ),
        ],
      ),
    );
    if (save != true || name.text.trim().isEmpty) return;
    try {
      final body = {
        'name': name.text.trim(),
        'location': location.text.trim().isEmpty ? null : location.text.trim(),
      };
      if (warehouse == null) {
        await _service.create(body);
      } else {
        await _service.update(warehouse.id, body);
      }
      _reload();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              warehouse == null
                  ? 'Gudang berhasil ditambahkan'
                  : 'Gudang berhasil diperbarui',
            ),
          ),
        );
      }
    } on ApiException catch (error) {
      if (mounted)
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.message)));
    }
  }

  Future<void> _delete(Warehouse warehouse) async {
    final ok = await showConfirmDialog(
      context,
      title: 'Hapus gudang?',
      message:
          'Gudang "${warehouse.name}" akan dihapus jika tidak memiliki relasi stok/transaksi.',
    );
    if (!ok) return;
    try {
      await _service.delete(warehouse.id);
      _reload();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Gudang berhasil dihapus')),
        );
      }
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
      body: FutureBuilder<List<Warehouse>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done)
            return const LoadingView();
          if (snapshot.hasError)
            return ErrorView(
              message: snapshot.error.toString(),
              onRetry: _reload,
            );
          final warehouses = snapshot.data ?? [];
          if (warehouses.isEmpty)
            return const EmptyView(title: 'Belum ada gudang');
          return RefreshIndicator(
            onRefresh: () async => _reload(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: warehouses.length,
              itemBuilder: (context, index) {
                final warehouse = warehouses[index];
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.warehouse_outlined),
                    title: Text(warehouse.name),
                    subtitle: Text(warehouse.location ?? 'Lokasi belum diisi'),
                    trailing: Wrap(
                      children: [
                        IconButton(
                          onPressed: () => _showForm(warehouse: warehouse),
                          icon: const Icon(Icons.edit_outlined),
                        ),
                        IconButton(
                          onPressed: () => _delete(warehouse),
                          icon: const Icon(Icons.delete_outline),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showForm,
        child: const Icon(Icons.add),
      ),
    );
  }
}
