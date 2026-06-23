import 'package:flutter/material.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/query_views.dart';
import '../../products/data/product_model.dart';
import '../../shared/crud_services.dart';
import '../../warehouse_locations/data/warehouse_location_model.dart';
import '../../warehouses/data/warehouse_model.dart';
import '../data/transfer_service.dart';
import 'transfer_detail_screen.dart';

class TransferListScreen extends StatefulWidget {
  const TransferListScreen({super.key});

  @override
  State<TransferListScreen> createState() => _TransferListScreenState();
}

class _TransferListScreenState extends State<TransferListScreen> {
  final _service = TransferService();
  String? _status;
  late Future<List<dynamic>> _future = _service.all();

  void _reload() => setState(() => _future = _service.all(status: _status));

  Future<void> _create() async {
    try {
      final products = await ProductService().all();
      final warehouses = await WarehouseService().all();
      final locations = await WarehouseLocationService().all();
      if (!mounted) return;
      if (products.isEmpty || warehouses.isEmpty || locations.length < 2) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Produk, gudang, dan rak belum mencukupi.'),
          ),
        );
        return;
      }

      int? productId = products.first.id;
      int? fromWarehouseId;
      int? toWarehouseId;
      int? fromLocationId;
      int? toLocationId;
      List<dynamic> stockPositions = await _service.productStocks(
        products.first.id,
      );
      stockPositions = stockPositions.where((raw) {
        final row = raw as Map<String, dynamic>;
        return (int.tryParse(row['quantity']?.toString() ?? '') ?? 0) > 0 &&
            row['warehouse_location_id'] != null;
      }).toList();
      if (stockPositions.isNotEmpty) {
        final firstPosition = stockPositions.first as Map<String, dynamic>;
        fromWarehouseId = firstPosition['warehouse_id'] as int?;
        fromLocationId = firstPosition['warehouse_location_id'] as int?;
      }
      if (!mounted) return;
      final quantity = TextEditingController(text: '1');
      final note = TextEditingController();

      Future<void> detectProduct(int id, StateSetter setDialogState) async {
        final rows = await _service.productStocks(id);
        final available = rows.where((raw) {
          final row = raw as Map<String, dynamic>;
          return (int.tryParse(row['quantity']?.toString() ?? '') ?? 0) > 0 &&
              row['warehouse_location_id'] != null;
        }).toList();
        setDialogState(() {
          stockPositions = available;
          if (available.isNotEmpty) {
            final row = available.first as Map<String, dynamic>;
            fromWarehouseId = row['warehouse_id'] as int?;
            fromLocationId = row['warehouse_location_id'] as int?;
          } else {
            fromWarehouseId = null;
            fromLocationId = null;
          }
        });
      }

      final save = await showDialog<bool>(
        context: context,
        builder: (context) => StatefulBuilder(
          builder: (context, setDialogState) {
            final sourceWarehouses = stockPositions
                .map((raw) => (raw as Map<String, dynamic>)['warehouse_id'])
                .whereType<int>()
                .toSet();
            final sourceLocations = locations.where(
              (location) =>
                  location.warehouseId == fromWarehouseId &&
                  stockPositions.any(
                    (raw) =>
                        (raw
                            as Map<String, dynamic>)['warehouse_location_id'] ==
                        location.id,
                  ),
            );
            final destinationLocations = locations.where(
              (location) =>
                  location.warehouseId == toWarehouseId &&
                  location.id != fromLocationId,
            );
            return AlertDialog(
              title: const Text('Buat Transfer'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    DropdownButtonFormField<int>(
                      initialValue: productId,
                      isExpanded: true,
                      decoration: const InputDecoration(labelText: 'Produk'),
                      items: products
                          .map(
                            (Product item) => DropdownMenuItem(
                              value: item.id,
                              child: Text(
                                item.name,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          )
                          .toList(),
                      onChanged: (value) async {
                        if (value == null) return;
                        setDialogState(() => productId = value);
                        await detectProduct(value, setDialogState);
                      },
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<int>(
                      initialValue: fromWarehouseId,
                      isExpanded: true,
                      decoration: const InputDecoration(
                        labelText: 'Gudang asal',
                      ),
                      items: warehouses
                          .where((item) => sourceWarehouses.contains(item.id))
                          .map(
                            (Warehouse item) => DropdownMenuItem(
                              value: item.id,
                              child: Text(item.name),
                            ),
                          )
                          .toList(),
                      onChanged: (value) => setDialogState(() {
                        fromWarehouseId = value;
                        fromLocationId = locations
                            .where((item) => item.warehouseId == value)
                            .where(
                              (item) => stockPositions.any(
                                (raw) =>
                                    (raw
                                        as Map<
                                          String,
                                          dynamic
                                        >)['warehouse_location_id'] ==
                                    item.id,
                              ),
                            )
                            .firstOrNull
                            ?.id;
                      }),
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<int>(
                      initialValue: fromLocationId,
                      isExpanded: true,
                      decoration: const InputDecoration(labelText: 'Rak asal'),
                      items: sourceLocations
                          .map(
                            (WarehouseLocation item) => DropdownMenuItem(
                              value: item.id,
                              child: Text('${item.code} - ${item.name}'),
                            ),
                          )
                          .toList(),
                      onChanged: (value) =>
                          setDialogState(() => fromLocationId = value),
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<int>(
                      initialValue: toWarehouseId,
                      isExpanded: true,
                      decoration: const InputDecoration(
                        labelText: 'Gudang tujuan',
                      ),
                      items: warehouses
                          .map(
                            (Warehouse item) => DropdownMenuItem(
                              value: item.id,
                              child: Text(item.name),
                            ),
                          )
                          .toList(),
                      onChanged: (value) => setDialogState(() {
                        toWarehouseId = value;
                        toLocationId = locations
                            .where(
                              (item) =>
                                  item.warehouseId == value &&
                                  item.id != fromLocationId,
                            )
                            .firstOrNull
                            ?.id;
                      }),
                    ),
                    const SizedBox(height: 10),
                    DropdownButtonFormField<int>(
                      initialValue: toLocationId,
                      isExpanded: true,
                      decoration: const InputDecoration(
                        labelText: 'Rak tujuan',
                      ),
                      items: destinationLocations
                          .map(
                            (WarehouseLocation item) => DropdownMenuItem(
                              value: item.id,
                              child: Text('${item.code} - ${item.name}'),
                            ),
                          )
                          .toList(),
                      onChanged: (value) =>
                          setDialogState(() => toLocationId = value),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: quantity,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Jumlah'),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: note,
                      maxLines: 2,
                      decoration: const InputDecoration(labelText: 'Catatan'),
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
                  child: const Text('Buat Transfer'),
                ),
              ],
            );
          },
        ),
      );
      if (save != true ||
          productId == null ||
          fromWarehouseId == null ||
          toWarehouseId == null ||
          fromLocationId == null ||
          toLocationId == null) {
        return;
      }
      await _service.create({
        'product_id': productId,
        'from_warehouse_id': fromWarehouseId,
        'to_warehouse_id': toWarehouseId,
        'from_warehouse_location_id': fromLocationId,
        'to_warehouse_location_id': toLocationId,
        'quantity': Validators.parseInt(quantity.text),
        'note': note.text.trim().isEmpty ? null : note.text.trim(),
      });
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
    const filters = <String?, String>{
      null: 'Semua',
      'pending': 'Pending',
      'in_transit': 'Perjalanan',
      'arrived': 'Sampai',
      'discrepancy': 'Selisih',
      'completed': 'Selesai',
    };
    return Scaffold(
      body: Column(
        children: [
          SizedBox(
            height: 56,
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              scrollDirection: Axis.horizontal,
              children: filters.entries
                  .map(
                    (entry) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(entry.value),
                        selected: _status == entry.key,
                        onSelected: (_) {
                          _status = entry.key;
                          _reload();
                        },
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          Expanded(
            child: FutureBuilder<List<dynamic>>(
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
                  return const EmptyView(title: 'Belum ada transfer');
                }
                return RefreshIndicator(
                  onRefresh: () async => _reload(),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: rows.length,
                    itemBuilder: (context, index) {
                      final item = rows[index] as Map<String, dynamic>;
                      final product = item['product'] as Map?;
                      final from = item['from_warehouse'] as Map?;
                      final to = item['to_warehouse'] as Map?;
                      final status = item['status']?.toString() ?? 'pending';
                      return Card(
                        child: ListTile(
                          onTap: () async {
                            await Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => TransferDetailScreen(
                                  transferId: item['id'] as int,
                                ),
                              ),
                            );
                            _reload();
                          },
                          leading: const CircleAvatar(
                            child: Icon(Icons.local_shipping_outlined),
                          ),
                          title: Text(
                            item['transfer_number']?.toString() ?? '-',
                          ),
                          subtitle: Text(
                            '${product?['name'] ?? 'Produk'}\n'
                            '${from?['name'] ?? '-'} → ${to?['name'] ?? '-'}',
                          ),
                          isThreeLine: true,
                          trailing: Chip(
                            label: Text(transferStatusLabels[status] ?? status),
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _create,
        icon: const Icon(Icons.add),
        label: const Text('Transfer'),
      ),
    );
  }
}
