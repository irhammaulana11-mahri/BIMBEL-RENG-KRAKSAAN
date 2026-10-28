import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'auth/auth_state.dart';
import 'screens/admin/admin_home.dart';
import 'screens/login_screen.dart';
import 'screens/parent/parent_home.dart';
import 'screens/student/student_home.dart';
import 'screens/tentor/tentor_home.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('id_ID');
  auth.init();
  runApp(const BimbelApp());
}

// Warna utama mengikuti versi web (brand-500)
const brandColor = Color(0xFF465FFF);

class BimbelApp extends StatelessWidget {
  const BimbelApp({super.key});

  ThemeData _theme(Brightness brightness) => ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: brandColor, brightness: brightness),
        useMaterial3: true,
        cardTheme: const CardThemeData(margin: EdgeInsets.symmetric(vertical: 5, horizontal: 4)),
        inputDecorationTheme: const InputDecorationTheme(border: OutlineInputBorder()),
      );

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
            return const Scaffold(body: Center(child: CircularProgressIndicator()));
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
