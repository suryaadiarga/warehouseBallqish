class ApiConfig {
  ApiConfig._();

  static const String defaultBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8080/api',
  );

  static String baseUrl = defaultBaseUrl;

  static String resolveAssetUrl(String? path) {
    final origin = baseUrl.replaceFirst(RegExp(r'/api/?$'), '');
    final fallback = '$origin/product-images/default-product.webp';
    if (path == null || path.isEmpty) return fallback;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return '$origin${path.startsWith('/') ? path : '/$path'}';
  }
}
