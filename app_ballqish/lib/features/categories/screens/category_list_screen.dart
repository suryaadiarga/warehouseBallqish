import 'package:flutter/material.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/widgets/confirm_dialog.dart';
import '../../../core/widgets/query_views.dart';
import '../../shared/crud_services.dart';
import '../data/category_model.dart';

class CategoryListScreen extends StatefulWidget {
  const CategoryListScreen({super.key});

  @override
  State<CategoryListScreen> createState() => _CategoryListScreenState();
}

class _CategoryListScreenState extends State<CategoryListScreen> {
  final _service = CategoryService();
  late Future<List<Category>> _future = _service.all();

  void _reload() => setState(() => _future = _service.all());

  Future<void> _showForm({Category? category}) async {
    final controller = TextEditingController(text: category?.name ?? '');
    final name = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(category == null ? 'Tambah Kategori' : 'Edit Kategori'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(labelText: 'Nama kategori'),
          autofocus: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Batal'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, controller.text.trim()),
            child: Text(category == null ? 'Tambah' : 'Simpan Perubahan'),
          ),
        ],
      ),
    );
    if (name == null || name.isEmpty) return;
    try {
      if (category == null) {
        await _service.create(name);
      } else {
        await _service.update(category.id, name);
      }
      _reload();
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              category == null
                  ? 'Kategori berhasil ditambahkan'
                  : 'Kategori berhasil diperbarui',
            ),
          ),
        );
    } on ApiException catch (error) {
      if (mounted)
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.message)));
    }
  }

  Future<void> _delete(Category category) async {
    final ok = await showConfirmDialog(
      context,
      title: 'Hapus kategori?',
      message: 'Kategori "${category.name}" akan dihapus.',
    );
    if (!ok) return;
    try {
      await _service.delete(category.id);
      _reload();
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Kategori berhasil dihapus')),
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
      body: FutureBuilder<List<Category>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done)
            return const LoadingView();
          if (snapshot.hasError)
            return ErrorView(
              message: snapshot.error.toString(),
              onRetry: _reload,
            );
          final categories = snapshot.data ?? [];
          if (categories.isEmpty)
            return const EmptyView(title: 'Belum ada kategori');
          return RefreshIndicator(
            onRefresh: () async => _reload(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: categories.length,
              itemBuilder: (context, index) {
                final category = categories[index];
                return Card(
                  child: ListTile(
                    leading: const Icon(Icons.category_outlined),
                    title: Text(category.name),
                    subtitle: Text('ID #${category.id}'),
                    trailing: Wrap(
                      children: [
                        IconButton(
                          onPressed: () => _showForm(category: category),
                          icon: const Icon(Icons.edit_outlined),
                        ),
                        IconButton(
                          onPressed: () => _delete(category),
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
