// Alamat backend (Laravel). Atur saat build/run:
//   flutter run --dart-define=API_URL=http://192.168.1.10:8001
// Default 10.0.2.2 = localhost komputer jika dijalankan di emulator Android.
const String apiOrigin = String.fromEnvironment('API_URL', defaultValue: 'http://10.0.2.2:8001');
const String apiBaseUrl = '$apiOrigin/api';
