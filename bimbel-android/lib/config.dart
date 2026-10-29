import 'package:flutter/foundation.dart';

// Alamat backend (Laravel). Atur saat build/run:
//   flutter run --dart-define=API_URL=http://192.168.1.10:8001
//   flutter build apk --release --dart-define=API_URL=https://api.domain-anda.id
// Debug/profile: default 10.0.2.2 = localhost komputer bila dijalankan di emulator Android.
// Rilis: tidak ada default; wajib https (MOB-01, juga dicek saat build di android/app/build.gradle.kts).
const String apiOrigin = String.fromEnvironment('API_URL', defaultValue: kReleaseMode ? '' : 'http://10.0.2.2:8001');
const String apiBaseUrl = '$apiOrigin/api';

/// Build rilis hanya boleh berbicara dengan API lewat HTTPS.
bool get apiConfigValid => !kReleaseMode || apiOrigin.startsWith('https://');
