import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../storage/token_storage.dart';
import 'api_exception.dart';

class ApiClient {
  ApiClient({http.Client? httpClient, TokenStorage? tokenStorage})
    : _httpClient = httpClient ?? http.Client(),
      _tokenStorage = tokenStorage ?? TokenStorage();

  final http.Client _httpClient;
  final TokenStorage _tokenStorage;

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) {
    return _send('GET', path, query: query);
  }

  Future<dynamic> post(String path, {Map<String, dynamic>? body}) {
    return _send('POST', path, body: body);
  }

  Future<dynamic> put(String path, {Map<String, dynamic>? body}) {
    return _send('PUT', path, body: body);
  }

  Future<dynamic> delete(String path, {Map<String, dynamic>? body}) {
    return _send('DELETE', path, body: body);
  }

  Future<dynamic> _send(
    String method,
    String path, {
    Map<String, dynamic>? query,
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}$path').replace(
      queryParameters: query
          ?.map((key, value) => MapEntry(key, value?.toString()))
          .cast<String, String>(),
    );
    final token = await _tokenStorage.getToken();
    final headers = <String, String>{
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };

    late http.Response response;
    try {
      response = switch (method) {
        'GET' => await _httpClient.get(uri, headers: headers),
        'POST' => await _httpClient.post(
          uri,
          headers: headers,
          body: jsonEncode(body ?? {}),
        ),
        'PUT' => await _httpClient.put(
          uri,
          headers: headers,
          body: jsonEncode(body ?? {}),
        ),
        'DELETE' => await _httpClient.delete(
          uri,
          headers: headers,
          body: jsonEncode(body ?? {}),
        ),
        _ => throw UnsupportedError(method),
      };
    } catch (_) {
      throw ApiException(
        'Tidak bisa terhubung ke server API (${ApiConfig.baseUrl}). Pastikan backend berjalan.',
      );
    }

    final payload = response.body.isEmpty ? null : jsonDecode(response.body);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (payload is Map<String, dynamic>) return payload;
      return {'success': true, 'data': payload};
    }

    if (payload is Map<String, dynamic>) {
      final errors = payload['errors'];
      var message = payload['message']?.toString() ?? 'Request gagal.';
      if (errors is Map && errors.isNotEmpty) {
        final first = errors.values.first;
        if (first is List && first.isNotEmpty) {
          message = first.first.toString();
        }
      }
      if (response.statusCode == 401) {
        await _tokenStorage.clear();
      }
      throw ApiException(
        message,
        statusCode: response.statusCode,
        errors: errors is Map<String, dynamic> ? errors : null,
      );
    }

    throw ApiException(
      'Request gagal (${response.statusCode}).',
      statusCode: response.statusCode,
    );
  }
}
