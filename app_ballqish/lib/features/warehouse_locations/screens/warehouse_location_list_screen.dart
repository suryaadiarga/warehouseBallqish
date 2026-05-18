import 'package:flutter/material.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/confirm_dialog.dart';
import '../../../core/widgets/query_views.dart';
import '../../shared/crud_services.dart';
import '../../warehouses/data/warehouse_model.dart';
import '../data/warehouse_location_model.dart';

class WarehouseLocationListScreen extends StatefulWidget {
  const WarehouseLocationListScreen({super.key});

  @override
  State<WarehouseLocationListScreen> createState() =>
      _WarehouseLocationListScreenState();
}

class _WarehouseLocationListScreenState
    extends State<WarehouseLocationListScreen> {
  final _service = WarehouseLocationService();
  final _warehouseService = WarehouseService();
  late Future<List<WarehouseLocation>> _future = _service.all();

  void _reload() => setState(() => _future = _service.all());

  Future<void> _showForm({WarehouseLocation? location}) async {
    final warehouses = await _warehouseService.all();
    if (!mounted) return;
    final code = TextEditingController(text: location?.code ?? '');
    final name = TextEditingController(text: location?.name ?? '');
    final description = TextEditingController(
      text: location?.description ?? '',
    );
    int? warehouseId =
        location?.warehouseId ??
        (warehouses.isEmpty ? null : warehouses.first.id);
    final save = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(
            location == null ? 'Tambah Lokasi Gudang' : 'Edit Lokasi Gudang',
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<int>(
                  initialValue: warehouseId,
                  decoration: const InputDecoration(labelText: 'Gudang'),
                  items: warehouses
                      .map(
                        (Warehouse item) => DropdownMenuItem(
                          value: item.id,
                          child: Text(item.name),
                        ),
                      )
                      .toList(),
                  onChanged: (value) =>
                      setDialogState(() => warehouseId = value),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: code,
                  decoration: const InputDecoration(labelText: 'Kode lokasi'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: name,
                  decoration: const InputDecoration(labelText: 'Nama lokasi'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: description,
                  decoration: const InputDecoration(labelText: 'Deskripsi'),
                  maxLines: 2,
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
              child: Text(location == null ? 'Tambah' : 'Simpan Perubahan'),
            ),
          ],
        ),
      ),
    );
    if (save != true ||
        warehouseId == null ||
        code.text.trim().isEmpty ||
        name.text.trim().isEmpty)
      return;
    try {
      final body = {
        'warehouse_id': warehouseId,
        'code': code.text.trim(),
        'name': name.text.trim(),
        'description': description.text.trim().isEmpty
            ? null
            : description.text.trim(),
      };
      if (location == null) {
        await _service.create(body);
      } else {
        await _service.update(location.id, body);
      }
      _reload();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              location == null
                  ? 'Lokasi gudang berhasil ditambahkan'
                  : 'Lokasi gudang berhasil diperbarui',
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

  Future<void> _delete(WarehouseLocation location) async {
    final ok = await showConfirmDialog(
      context,
      title: 'Hapus lokasi gudang?',
      message:
          'Lokasi "${location.code} - ${location.name}" akan dihapus jika tidak digunakan stok/transaksi.',
    );
    if (!ok) return;
    try {
      await _service.delete(location.id);
      _reload();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Lokasi gudang berhasil dihapus')),
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
      body: FutureBuilder<List<WarehouseLocation>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done)
            return const LoadingView();
          if (snapshot.hasError)
            return ErrorView(
              message: snapshot.error.toString(),
              onRetry: _reload,
            );
          final locations = snapshot.data ?? [];
          if (locations.isEmpty)
            return const EmptyView(title: 'Belum ada lokasi gudang');
          return RefreshIndicator(
            onRefresh: () async => _reload(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: locations.length,
              itemBuilder: (context, index) {
                final location = locations[index];
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.grid_view_outlined),
                    title: Text('${location.code} - ${location.name}'),
                    subtitle: Text(
                      location.warehouse?.name ??
                          'Gudang #${location.warehouseId}',
                    ),
                    trailing: Wrap(
                      children: [
                        IconButton(
                          onPressed: () => _showForm(location: location),
                          icon: const Icon(Icons.edit_outlined),
                        ),
                        IconButton(
                          onPressed: () => _delete(location),
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
