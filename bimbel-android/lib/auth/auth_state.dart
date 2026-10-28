import 'package:flutter/foundation.dart';

import '../api/api_client.dart';

/// Peran yang didukung aplikasi mobile. Admin & Super Admin memakai portal admin versi ringan.
const supportedRoles = {'siswa', 'orang_tua', 'tentor', 'admin', 'super_admin'};

class AuthState extends ChangeNotifier {
  Map<String, dynamic>? user;
  bool initializing = true;
  String? logoutMessage;

  String? get role => user?['role']?['role_name'];
  String get name => user?['name'] ?? '';

  Future<void> init() async {
    api.onUnauthorized = () {
      if (user != null) _reset('Sesi berakhir. Silakan login kembali.');
    };
    try {
      if (await api.loadToken() != null) await _loadProfile();
    } catch (_) {
      await api.clearToken();
      user = null;
    }
    initializing = false;
    notifyListeners();
  }

  Future<void> _loadProfile() async {
    final res = await api.get('/profile');
    user = Map<String, dynamic>.from(res);
  }

  Future<void> login(String email, String password) async {
    final res = await api.post('/login', {'email': email.trim(), 'password': password});
    final roleName = res['user']?['role']?['role_name'];
    if (!supportedRoles.contains(roleName)) {
      // Cabut token agar tidak tertinggal di server
      await api.saveToken(res['token']);
      try {
        await api.post('/logout');
      } catch (_) {}
      await api.clearToken();
      throw ApiException('Akun ini hanya dapat digunakan di versi web.');
    }
    await api.saveToken(res['token']);
    await _loadProfile();
    logoutMessage = null;
    notifyListeners();
  }

  Future<void> logout() async {
    try {
      await api.post('/logout');
    } catch (_) {}
    await api.clearToken();
    _reset(null);
  }

  void _reset(String? message) {
    user = null;
    logoutMessage = message;
    notifyListeners();
  }
}

final auth = AuthState();
