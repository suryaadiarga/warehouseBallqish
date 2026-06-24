import 'package:flutter/material.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/query_views.dart';
import '../../../core/widgets/product_image.dart';
import '../../products/data/product_model.dart';
import '../../shared/crud_services.dart';
import '../../warehouses/data/warehouse_model.dart';
import '../data/inventory_service.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  final _inventory = InventoryService();
  var _tab = 0;
  late Future<List<dynamic>> _future = _inventory.productStocks();

  void _loadStocks() => setState(() => _future = _inventory.productStocks());
  void _loadReports() => setState(() => _future = _inventory.reports());

  Warehouse? _mainWarehouse(List<Warehouse> warehouses) {
    if (warehouses.isEmpty) return null;
    return warehouses.firstWhere(
      (item) =>
          RegExp(r'pusat|utama|main', caseSensitive: false).hasMatch(item.name),
      orElse: () => warehouses.first,
    );
  }

  Future<void> _createInventoryMovement() async {
    final suppliers = await SupplierService().all();
    final products = await ProductService().all();
    final warehouses = await WarehouseService().all();
    if (!mounted) return;

    var type = 'in';
    int? supplierId = suppliers.isEmpty ? null : suppliers.first.id;
    var filteredProducts = products
        .where((item) => item.supplierId == supplierId)
        .toList();
    int? productId = filteredProducts.isEmpty
        ? null
        : filteredProducts.first.id;
    int? warehouseId = _mainWarehouse(warehouses)?.id;
    var destinationType = 'customer';
    int? toWarehouseId;
    final qty = TextEditingController(text: '1');
    final note = TextEditingController();
    final save = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            title: const Text('Inbound & Outbound'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(value: 'in', label: Text('Masuk')),
                      ButtonSegment(value: 'out', label: Text('Keluar')),
                    ],
                    selected: {type},
                    onSelectionChanged: (value) => setDialogState(() {
                      type = value.first;
                      if (type == 'in') {
                        supplierId = suppliers.isEmpty
                            ? null
                            : suppliers.first.id;
                        filteredProducts = products
                            .where((item) => item.supplierId == supplierId)
                            .toList();
                        productId = filteredProducts.isEmpty
                            ? null
                            : filteredProducts.first.id;
                        destinationType = 'customer';
                        toWarehouseId = null;
                      } else {
                        supplierId = null;
                        filteredProducts = products;
                        productId = products.isEmpty ? null : products.first.id;
                      }
                    }),
                  ),
                  if (type == 'in') ...[
                    const SizedBox(height: 10),
                    DropdownButtonFormField<int>(
                      initialValue: supplierId,
                      decoration: const InputDecoration(labelText: 'Supplier'),
                      items: suppliers
                          .map(
                            (Supplier item) => DropdownMenuItem(
                              value: item.id,
                              child: Text(item.name),
                            ),
                          )
                          .toList(),
                      onChanged: (value) => setDialogState(() {
                        supplierId = value;
                        filteredProducts = products
                            .where((item) => item.supplierId == supplierId)
                            .toList();
                        productId = filteredProducts.isEmpty
                            ? null
                            : filteredProducts.first.id;
                      }),
                    ),
                  ],
                  const SizedBox(height: 10),
                  DropdownButtonFormField<int>(
                    initialValue: productId,
                    decoration: const InputDecoration(labelText: 'Produk'),
                    items: filteredProducts
                        .map(
                          (Product item) => DropdownMenuItem(
                            value: item.id,
                            child: Text(item.name),
                          ),
                        )
                        .toList(),
                    onChanged: (value) =>
                        setDialogState(() => productId = value),
                  ),
                  const SizedBox(height: 10),
                  DropdownButtonFormField<int>(
                    initialValue: warehouseId,
                    decoration: InputDecoration(
                      labelText: type == 'in'
                          ? 'Masuk ke gudang'
                          : 'Keluar dari gudang',
                    ),
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
                  if (type == 'out') ...[
                    const SizedBox(height: 10),
                    DropdownButtonFormField<String>(
                      initialValue: destinationType,
                      decoration: const InputDecoration(labelText: 'Tujuan'),
                      items: const [
                        DropdownMenuItem(
                          value: 'customer',
                          child: Text('Customer'),
                        ),
                        DropdownMenuItem(
                          value: 'transit',
                          child: Text('Gudang transit'),
                        ),
                      ],
                      onChanged: (value) => setDialogState(() {
                        destinationType = value ?? 'customer';
                        toWarehouseId = null;
                      }),
                    ),
                    if (destinationType == 'transit') ...[
                      const SizedBox(height: 10),
                      DropdownButtonFormField<int>(
                        initialValue: toWarehouseId,
                        decoration: const InputDecoration(
                          labelText: 'Gudang transit',
                        ),
                        items: warehouses
                            .where((item) => item.id != warehouseId)
                            .map(
                              (Warehouse item) => DropdownMenuItem(
                                value: item.id,
                                child: Text(item.name),
                              ),
                            )
                            .toList(),
                        onChanged: (value) =>
                            setDialogState(() => toWarehouseId = value),
                      ),
                    ],
                  ],
                  const SizedBox(height: 10),
                  TextField(
                    controller: qty,
                    decoration: const InputDecoration(labelText: 'Quantity'),
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: note,
                    decoration: const InputDecoration(labelText: 'Catatan'),
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
                child: const Text('Simpan'),
              ),
            ],
          );
        },
      ),
    );
    if (save != true || productId == null || warehouseId == null) return;
    try {
      await _inventory.createInventoryMovement({
        'type': type,
        if (type == 'in') 'supplier_id': supplierId,
        'product_id': productId,
        'warehouse_id': warehouseId,
        if (type == 'out') 'destination_type': destinationType,
        if (type == 'out' && destinationType == 'transit')
          'to_warehouse_id': toWarehouseId,
        'quantity': Validators.parseInt(qty.text),
        'note': note.text.trim().isEmpty ? null : note.text.trim(),
      });
      _loadReports();
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Inbound & outbound berhasil dicatat.')),
        );
    } on ApiException catch (error) {
      if (mounted)
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: SegmentedButton<int>(
              selected: {_tab},
              onSelectionChanged: (value) {
                _tab = value.first;
                _tab == 0 ? _loadStocks() : _loadReports();
              },
              segments: const [
                ButtonSegment(
                  value: 0,
                  icon: Icon(Icons.inventory),
                  label: Text('Stok'),
                ),
                ButtonSegment(
                  value: 1,
                  icon: Icon(Icons.history),
                  label: Text('Mutasi'),
                ),
              ],
            ),
          ),
          Expanded(
            child: FutureBuilder<List<dynamic>>(
              future: _future,
              builder: (context, snapshot) {
                if (snapshot.connectionState != ConnectionState.done)
                  return const LoadingView();
                if (snapshot.hasError)
                  return ErrorView(
                    message: snapshot.error.toString(),
                    onRetry: _tab == 0 ? _loadStocks : _loadReports,
                  );
                final rows = snapshot.data ?? [];
                if (rows.isEmpty)
                  return EmptyView(
                    title: _tab == 0
                        ? 'Belum ada stok per gudang'
                        : 'Belum ada riwayat mutasi',
                  );
                return RefreshIndicator(
                  onRefresh: () async =>
                      _tab == 0 ? _loadStocks() : _loadReports(),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: rows.length,
                    itemBuilder: (context, index) {
                      final row = rows[index] as Map<String, dynamic>;
                      if (_tab == 0) {
                        final product = row['product'] as Map?;
                        final warehouse = row['warehouse'] as Map?;
                        final location = row['warehouse_location'] as Map?;
                        return Card(
                          child: ListTile(
                            leading: ProductImage(
                              imageUrl: product?['image_url']?.toString(),
                              size: 52,
                            ),
                            title: Text(
                              product?['name']?.toString() ?? 'Produk',
                            ),
                            subtitle: Text(
                              '${warehouse?['name'] ?? '-'}${location == null ? '' : ' / ${location['code']}'}',
                            ),
                            trailing: Text(
                              '${row['quantity'] ?? 0}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        );
                      }
                      final product = row['product'] as Map?;
                      final type = row['type']?.toString() ?? '-';
                      return Card(
                        child: ListTile(
                          leading: ProductImage(
                            imageUrl: product?['image_url']?.toString(),
                            size: 52,
                          ),
                          title: Text(
                            product?['name']?.toString() ??
                                row['reference_number']?.toString() ??
                                'Mutasi',
                          ),
                          subtitle: Text(
                            '${row['status'] ?? '-'} - ${row['mutation_source'] ?? 'manual'}',
                          ),
                          trailing: Text('$type ${row['quantity'] ?? 0}'),
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
        onPressed: _createInventoryMovement,
        icon: const Icon(Icons.add),
        label: const Text('Tambah Stok'),
      ),
    );
  }
}
