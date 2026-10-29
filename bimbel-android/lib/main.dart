import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'auth/auth_state.dart';
import 'config.dart';
import 'screens/admin/admin_home.dart';
import 'screens/login_screen.dart';
import 'screens/parent/parent_home.dart';
import 'screens/student/student_home.dart';
import 'screens/tentor/tentor_home.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('id_ID');
  // Pengaman terakhir bila build rilis dibuat tanpa API_URL https (lihat config.dart)
  if (!apiConfigValid) {
    runApp(const _ConfigErrorApp());
    return;
  }
  auth.init();
  runApp(const BimbelApp());
}

class _ConfigErrorApp extends StatelessWidget {
  const _ConfigErrorApp();

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        body: Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Text(
              'Aplikasi belum dikonfigurasi dengan alamat server yang aman (HTTPS). Hubungi admin lembaga.',
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ),
    );
  }
}

// Warna utama mengikuti versi web (brand-500)
const brandColor = Color(0xFF465FFF);

class BimbelApp extends StatelessWidget {
  const BimbelApp({super.key});

  // Tema berwarna namun tenang: kartu membulat berbingkai tipis, tombol & isian membulat
  ThemeData _theme(Brightness brightness) {
    final scheme = ColorScheme.fromSeed(seedColor: brandColor, brightness: brightness);
    final dark = brightness == Brightness.dark;
    final radius = BorderRadius.circular(16);
    return ThemeData(
      colorScheme: scheme,
      useMaterial3: true,
      scaffoldBackgroundColor: dark ? const Color(0xFF0B1120) : const Color(0xFFF5F7FB),
      cardTheme: CardThemeData(
        margin: const EdgeInsets.symmetric(vertical: 5, horizontal: 4),
        elevation: 0,
        color: dark ? const Color(0xFF111827) : Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: radius,
          side: BorderSide(color: dark ? const Color(0xFF273449) : const Color(0xFFE6EAF2)),
        ),
      ),
      appBarTheme: const AppBarTheme(centerTitle: false, elevation: 0, scrolledUnderElevation: 0),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: dark ? const Color(0xFF172033) : const Color(0xFFF8FAFC),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
      ),
      chipTheme: ChipThemeData(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
      navigationBarTheme: NavigationBarThemeData(
        indicatorColor: scheme.primaryContainer,
        labelTextStyle: WidgetStateProperty.all(const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Bimbel Reng Kraksaan',
      debugShowCheckedModeBanner: false,
      theme: _theme(Brightness.light),
      darkTheme: _theme(Brightness.dark),
      home: ListenableBuilder(
        listenable: auth,
        builder: (context, _) {
          if (auth.initializing) {
            return const _SplashScreen();
          }
          return switch (auth.role) {
            'siswa' => const StudentHome(),
            'orang_tua' => const ParentHome(),
            'tentor' => const TentorHome(),
            'admin' || 'super_admin' => const AdminHome(),
            _ => const LoginScreen(),
          };
        },
      ),
    );
  }
}

/// Layar memuat saat sesi login diperiksa: logo lembaga di latar putih, menyambung splash sistem.
class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset('assets/images/logo.png', width: 220, semanticLabel: 'Bimbel Reng Kraksaan'),
            const SizedBox(height: 32),
            const SizedBox(width: 28, height: 28, child: CircularProgressIndicator(strokeWidth: 3)),
          ],
        ),
      ),
    );
  }
}
