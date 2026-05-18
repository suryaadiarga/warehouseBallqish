class Validators {
  Validators._();

  static String? required(String? value, String label) {
    if (value == null || value.trim().isEmpty) return '$label wajib diisi';
    return null;
  }

  static String? email(String? value) {
    final empty = required(value, 'Email');
    if (empty != null) return empty;
    if (!value!.contains('@')) return 'Format email tidak valid';
    return null;
  }

  static int parseInt(String value) => int.tryParse(value.trim()) ?? 0;
  static double? parseNullableDouble(String value) =>
      value.trim().isEmpty ? null : double.tryParse(value.trim());
}
