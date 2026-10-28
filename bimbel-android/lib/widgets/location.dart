import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

import 'common.dart';

/// Posisi GPS perangkat untuk dikirim ke API (latitude, longitude, accuracy).
/// Melempar pesan ramah bila GPS mati atau izin ditolak.
Future<Map<String, dynamic>> currentPosition() async {
  if (!await Geolocator.isLocationServiceEnabled()) {
    throw 'GPS / layanan lokasi belum aktif. Nyalakan lokasi di pengaturan HP.';
  }
  var permission = await Geolocator.checkPermission();
  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
  }
  if (permission == LocationPermission.denied) {
    throw 'Izin lokasi ditolak. Izinkan akses lokasi untuk absen.';
  }
  if (permission == LocationPermission.deniedForever) {
    await Geolocator.openAppSettings();
    throw 'Izin lokasi diblokir. Aktifkan izin lokasi aplikasi di pengaturan.';
  }
  final pos = await Geolocator.getCurrentPosition(
    locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, timeLimit: Duration(seconds: 25)),
  );
  return {'latitude': pos.latitude, 'longitude': pos.longitude, 'accuracy': pos.accuracy};
}

/// Jarak dua titik dalam meter.
double distanceMeter(num lat1, num lng1, num lat2, num lng2) =>
    Geolocator.distanceBetween(lat1.toDouble(), lng1.toDouble(), lat2.toDouble(), lng2.toDouble());

String mapsUrl(dynamic lat, dynamic lng) => 'https://www.google.com/maps?q=$lat,$lng';

/// Form pengajuan lokasi les sementara (tentor & orang tua).
/// Titik diambil dari GPS HP, atau ditempel dari Google Maps dalam format "lat, lng".
/// [submit] mengirim body ke API dan mengembalikan pesan sukses.
Future<bool?> showLocationRequestDialog(
  BuildContext context,
  Map session,
  Future<String?> Function(Map<String, dynamic> body) submit,
) {
  final name = TextEditingController();
  final address = TextEditingController();
  final coords = TextEditingController();
  final reason = TextEditingController();
  var sending = false;
  var locating = false;

  return showDialog<bool>(
    context: context,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setState) => AlertDialog(
        title: const Text('Ajukan Lokasi Les Sementara'),
        content: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('${text(session['subject_name'])} • ${tanggal(session['session_date'])} ${text(session['start_time'])}'),
            const SizedBox(height: 4),
            const Text('Berlaku untuk sesi ini setelah disetujui Admin. Tentor absen di titik ini (toleransi 100 m).',
                style: TextStyle(fontSize: 12, color: Colors.grey)),
            TextField(controller: name, decoration: const InputDecoration(labelText: 'Nama tempat (mis. Rumah nenek)')),
            TextField(controller: address, maxLines: 2, decoration: const InputDecoration(labelText: 'Alamat')),
            TextField(
              controller: coords,
              decoration: const InputDecoration(labelText: 'Titik lokasi (lat, lng)', hintText: '-7.7561, 113.4157'),
            ),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                icon: locating
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.my_location, size: 18),
                label: const Text('Pakai lokasi saya sekarang'),
                onPressed: locating
                    ? null
                    : () async {
                        setState(() => locating = true);
                        try {
                          final p = await currentPosition();
                          coords.text = '${(p['latitude'] as double).toStringAsFixed(6)}, ${(p['longitude'] as double).toStringAsFixed(6)}';
                        } catch (e) {
                          if (ctx.mounted) showSnack(ctx, '$e', error: true);
                        } finally {
                          setState(() => locating = false);
                        }
                      },
              ),
            ),
            TextField(controller: reason, maxLines: 2, decoration: const InputDecoration(labelText: 'Alasan')),
          ]),
        ),
        actions: [
          TextButton(onPressed: sending ? null : () => Navigator.pop(ctx), child: const Text('Batal')),
          FilledButton(
            onPressed: sending
                ? null
                : () async {
                    final parts = coords.text.split(',').map((p) => double.tryParse(p.trim())).toList();
                    if (parts.length != 2 || parts.contains(null)) {
                      return showSnack(ctx, 'Titik lokasi wajib diisi, format "lat, lng".', error: true);
                    }
                    setState(() => sending = true);
                    try {
                      final message = await submit({
                        'location_name': name.text.trim(),
                        'address': address.text.trim(),
                        'latitude': parts[0],
                        'longitude': parts[1],
                        'reason': reason.text.trim(),
                      });
                      if (ctx.mounted) Navigator.pop(ctx, true);
                      if (context.mounted) showSnack(context, text(message, 'Pengajuan terkirim.'));
                    } catch (e) {
                      if (ctx.mounted) showSnack(ctx, '$e', error: true);
                      setState(() => sending = false);
                    }
                  },
            child: const Text('Kirim'),
          ),
        ],
      ),
    ),
  );
}
