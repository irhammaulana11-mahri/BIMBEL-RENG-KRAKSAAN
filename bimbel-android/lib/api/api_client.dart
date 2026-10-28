import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import '../config.dart';

class ApiException implements Exception {
  final String message;
  final int? status;
  ApiException(this.message, [this.status]);

  @override
  String toString() => message;
}

/// Pembungkus HTTP ke API Laravel: token Bearer, JSON, dan pesan error yang ramah.
class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'auth_token';

  String? _token;

  /// Dipanggil saat token ditolak server (401/403 sesi habis) agar aplikasi kembali ke login.
  void Function()? onUnauthorized;

  Future<String?> loadToken() async => _token = await _storage.read(key: _tokenKey);

  Future<void> saveToken(String token) async {
    _token = token;
    await _storage.write(key: _tokenKey, value: token);
  }

  Future<void> clearToken() async {
    _token = null;
    await _storage.delete(key: _tokenKey);
  }

  Map<String, String> get _headers => {
        'Accept': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Uri _uri(String path, [Map<String, dynamic>? query]) {
    final q = <String, String>{};
    query?.forEach((k, v) {
      if (v != null && '$v'.isNotEmpty) q[k] = '$v';
    });
    return Uri.parse('$apiBaseUrl$path').replace(queryParameters: q.isEmpty ? null : q);
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) =>
      _send(() => http.get(_uri(path, query), headers: _headers));

  Future<dynamic> post(String path, [Map<String, dynamic>? body]) => _send(() => http.post(_uri(path),
      headers: {..._headers, 'Content-Type': 'application/json'}, body: jsonEncode(body ?? {})));

  Future<dynamic> put(String path, [Map<String, dynamic>? body]) => _send(() => http.put(_uri(path),
      headers: {..._headers, 'Content-Type': 'application/json'}, body: jsonEncode(body ?? {})));

  Future<dynamic> delete(String path) => _send(() => http.delete(_uri(path), headers: _headers));

  Future<dynamic> patch(String path, [Map<String, dynamic>? body]) => _send(() => http.patch(_uri(path),
      headers: {..._headers, 'Content-Type': 'application/json'}, body: jsonEncode(body ?? {})));

  /// Kirim form multipart (mis. bukti transfer).
  Future<dynamic> multipart(String path, Map<String, String> fields, String fileField, String filePath) {
    return _send(() async {
      final req = http.MultipartRequest('POST', _uri(path))
        ..headers.addAll(_headers)
        ..fields.addAll(fields)
        ..files.add(await http.MultipartFile.fromPath(fileField, filePath));
      return http.Response.fromStream(await req.send());
    });
  }

  /// Unduh berkas privat (butuh token), mis. materi belajar atau bukti transfer.
  Future<http.Response> download(String path) async {
    final res = await http.get(_uri(path), headers: _headers).timeout(const Duration(seconds: 60));
    if (res.statusCode != 200) throw ApiException('Berkas tidak dapat diunduh (${res.statusCode}).', res.statusCode);
    return res;
  }

  Future<dynamic> _send(Future<http.Response> Function() request) async {
    http.Response res;
    try {
      res = await request().timeout(const Duration(seconds: 30));
    } catch (_) {
      throw ApiException('Tidak dapat terhubung ke server. Periksa koneksi internet.');
    }

    dynamic body;
    try {
      body = res.body.isEmpty ? null : jsonDecode(res.body);
    } catch (_) {
      body = null;
    }

    if (res.statusCode >= 200 && res.statusCode < 300) return body;

    // Hanya permintaan bertoken yang berarti sesi habis; 401 saat login = email/password salah
    if ((res.statusCode == 401 || res.statusCode == 419) && _token != null) {
      await clearToken();
      onUnauthorized?.call();
      throw ApiException('Sesi berakhir. Silakan login kembali.', res.statusCode);
    }
    throw ApiException(_errorMessage(body, res.statusCode), res.statusCode);
  }

  String _errorMessage(dynamic body, int status) {
    if (body is Map) {
      final errors = body['errors'];
      if (errors is Map && errors.isNotEmpty) {
        final first = errors.values.first;
        if (first is List && first.isNotEmpty) return '${first.first}';
      }
      if (body['message'] is String && (body['message'] as String).isNotEmpty) return body['message'];
    }
    if (status >= 500) return 'Terjadi kesalahan pada server ($status).';
    return 'Permintaan gagal ($status).';
  }
}

final api = ApiClient.instance;
