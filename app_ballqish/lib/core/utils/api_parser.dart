List<dynamic> dataList(Map<String, dynamic> envelope) {
  final data = envelope['data'];
  return data is List ? data : <dynamic>[];
}

Map<String, dynamic> dataMap(Map<String, dynamic> envelope) {
  final data = envelope['data'];
  return data is Map<String, dynamic> ? data : <String, dynamic>{};
}
