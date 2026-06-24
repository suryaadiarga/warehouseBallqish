import 'package:flutter/material.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/confirm_dialog.dart';
import '../../../core/widgets/query_views.dart';
import '../../../core/widgets/product_image.dart';
import '../../inventory/screens/inventory_screen.dart';
import '../../shared/crud_services.dart';
import '../data/product_model.dart';

class ProductListScreen extends StatefulWidget {
  const ProductListScreen({super.key});

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  final _service = ProductService();
  final _categoryService = CategoryService();
  final _search = TextEditingController();
  late Future<List<Product>> _future = _service.all();

  void _reload() =>
      setState(() => _future = _service.all(search: _search.text.trim()));

  Future<void> _showForm(Product product) async {
    final categories = await _categoryService.all();
    if (!mounted) return;
    final sku = TextEditingController(text: product.sku);
    final barcode = TextEditingController(text: product.barcode ?? '');
    final name = TextEditingController(text: product.name);
    final minStock = TextEditingController(
      text: product.minStockLevel.toString(),
    );
    final price = TextEditingController(text: product.price.toString());
    int? categoryId = product.categoryId;
    final save = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Edit Produk'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<int>(
                  initialValue: categoryId,
                  decoration: const InputDecoration(labelText: 'Kategori'),
                  items: categories
                      .map(
                        (item) => DropdownMenuItem(
                          value: item.id,
                          child: Text(item.name),
                        ),
                      )
                      .toList(),
                  onChanged: (value) =>
                      setDialogState(() => categoryId = value),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: name,
                  decoration: const InputDecoration(labelText: 'Nama produk'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: sku,
                  decoration: const InputDecoration(labelText: 'SKU'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: barcode,
                  decoration: const InputDecoration(
                    labelText: 'Barcode opsional',
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: minStock,
                  decoration: const InputDecoration(labelText: 'Min stock'),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: price,
                  decoration: const InputDecoration(labelText: 'Harga'),
                  keyboardType: TextInputType.number,
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
              child: const Text('Simpan Perubahan'),
            ),
          ],
        ),
      ),
    );
    if (save != true ||
        categoryId == null ||
        name.text.trim().isEmpty ||
        sku.text.trim().isEmpty)
      return;
    try {
      final body = {
        'category_id': categoryId,
        'sku': sku.text.trim(),
        'barcode': barcode.text.trim().isEmpty ? null : barcode.text.trim(),
        'name': name.text.trim(),
        'min_stock_level': Validators.parseInt(minStock.text),
        'price': double.tryParse(price.text.trim()) ?? 0,
      };
      await _service.update(product.id, body);
      _reload();
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Produk berhasil diperbarui')),
        );
    } on ApiException catch (error) {
      if (mounted)
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.message)));
    }
  }

  Future<void> _delete(Product product) async {
    final ok = await showConfirmDialog(
      context,
      title: 'Hapus produk?',
      message: 'Produk "${product.name}" akan dihapus.',
    );
    if (!ok) return;
    try {
      await _service.delete(product.id);
      _reload();
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
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: SearchBar(
              controller: _search,
              hintText: 'Cari nama atau SKU',
              leading: const Icon(Icons.search),
              trailing: [
                IconButton(
                  onPressed: _reload,
                  icon: const Icon(Icons.arrow_forward),
                ),
              ],
              onSubmitted: (_) => _reload(),
            ),
          ),
          Expanded(
            child: FutureBuilder<List<Product>>(
              future: _future,
              builder: (context, snapshot) {
                if (snapshot.connectionState != ConnectionState.done)
                  return const LoadingView();
                if (snapshot.hasError)
                  return ErrorView(
                    message: snapshot.error.toString(),
                    onRetry: _reload,
                  );
                final products = snapshot.data ?? [];
                if (products.isEmpty)
                  return const EmptyView(title: 'Belum ada produk');
                return RefreshIndicator(
                  onRefresh: () async => _reload(),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: products.length,
                    itemBuilder: (context, index) {
                      final product = products[index];
                      return Card(
                        child: ListTile(
                          leading: ProductImage(imageUrl: product.imageUrl),
                          title: Text(product.name),
                          subtitle: Text(
                            '${product.sku} - ${product.category?.name ?? 'Tanpa kategori'}',
                          ),
                          trailing: Wrap(
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              Padding(
                                padding: const EdgeInsets.only(
                                  top: 12,
                                  right: 4,
                                ),
                                child: Text(
                                  'Stok ${product.stock}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              IconButton(
                                onPressed: () => _showForm(product),
                                icon: const Icon(Icons.edit_outlined),
                              ),
                              IconButton(
                                onPressed: () => _delete(product),
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
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          Navigator.of(
            context,
          ).push(MaterialPageRoute(builder: (_) => const InventoryScreen()));
        },
        icon: const Icon(Icons.add),
        label: const Text('Tambah Stok'),
      ),
    );
  }
}
