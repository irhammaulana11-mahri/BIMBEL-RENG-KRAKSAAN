import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

/*
|--------------------------------------------------------------------------
| FORMAT
|--------------------------------------------------------------------------
*/

String rupiah(dynamic value) =>
    NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(num.tryParse('$value') ?? 0);

/// "2026-10-27" -> "Sel, 27 Okt 2026"
String tanggal(dynamic value, {bool withDay = true}) {
  final d = DateTime.tryParse('${value ?? ''}');
  if (d == null) return value == null ? '-' : '$value';
  return DateFormat(withDay ? 'EEE, d MMM yyyy' : 'd MMM yyyy', 'id_ID').format(d);
}

String periode(dynamic month, dynamic year) {
  final m = int.tryParse('$month');
  if (m == null || m < 1 || m > 12) return '$month/$year';
  return '${DateFormat.MMMM('id_ID').format(DateTime(2000, m))} $year';
}

String text(dynamic v, [String fallback = '-']) => (v == null || '$v'.trim().isEmpty) ? fallback : '$v';

/// Ambil label dari nilai yang bisa berupa string atau map (mis. snapshot rapor).
String label(dynamic v) {
  if (v is Map) return text(v['label'] ?? v['name'] ?? v['title']);
  return text(v);
}

String ymd(DateTime d) => DateFormat('yyyy-MM-dd').format(d);

Future<void> openUrl(BuildContext context, String? url) async {
  final uri = Uri.tryParse(url ?? '');
  if (uri == null || !await launchUrl(uri, mode: LaunchMode.externalApplication)) {
    if (context.mounted) showSnack(context, 'Tautan tidak dapat dibuka.');
  }
}

void showSnack(BuildContext context, String message, {bool error = false}) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(
      content: Text(message),
      backgroundColor: error ? Theme.of(context).colorScheme.error : null,
    ));
}

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

const _statusInfo = <String, (String, Color)>{
  'SCHEDULED': ('Terjadwal', Colors.blue),
  'RESCHEDULED': ('Dipindah', Colors.orange),
  'IN_PROGRESS': ('Berlangsung', Colors.indigo),
  'COMPLETED': ('Selesai', Colors.green),
  'CANCELLED': ('Batal', Colors.red),
  'READY': ('Siap', Colors.blue),
  'HADIR': ('Hadir', Colors.green),
  'IZIN': ('Izin', Colors.orange),
  'SAKIT': ('Sakit', Colors.purple),
  'ALPA': ('Alpa', Colors.red),
  'BELUM': ('Belum', Colors.grey),
  'SUBMITTED': ('Menunggu Nilai', Colors.orange),
  'GRADED': ('Dinilai', Colors.green),
  'UNPAID': ('Belum Bayar', Colors.red),
  'PARTIAL': ('Sebagian', Colors.orange),
  'PAID': ('Lunas', Colors.green),
  'PENDING': ('Menunggu', Colors.orange),
  'APPROVED': ('Disetujui', Colors.green),
  'VERIFIED': ('Terverifikasi', Colors.green),
  'CONFIRMED': ('Diterima', Colors.green),
  'REJECTED': ('Ditolak', Colors.red),
};

class StatusChip extends StatelessWidget {
  final String? status;
  const StatusChip(this.status, {super.key});

  @override
  Widget build(BuildContext context) {
    final info = _statusInfo[status] ?? (text(status), Colors.grey);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: info.$2.withValues(alpha: .12), borderRadius: BorderRadius.circular(20)),
      child: Text(info.$1, style: TextStyle(color: info.$2, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}

/*
|--------------------------------------------------------------------------
| LAYOUT
|--------------------------------------------------------------------------
*/

/// Memuat data lalu menampilkan loading / error (dengan tombol coba lagi) / isi.
/// Mendukung tarik-untuk-muat-ulang.
class AsyncView<T> extends StatefulWidget {
  final Future<T> Function() load;
  final Widget Function(BuildContext context, T data, Future<void> Function() reload) builder;

  const AsyncView({super.key, required this.load, required this.builder});

  @override
  State<AsyncView<T>> createState() => AsyncViewState<T>();
}

class AsyncViewState<T> extends State<AsyncView<T>> {
  late Future<T> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.load();
  }

  Future<void> reload() async {
    final f = widget.load();
    // Blok {} agar callback tidak mengembalikan Future (setState menolaknya)
    setState(() {
      _future = f;
    });
    try {
      await f;
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<T>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snap.hasError) {
          return RefreshIndicator(
            onRefresh: reload,
            child: ListView(children: [
              const SizedBox(height: 120),
              const Icon(Icons.cloud_off, size: 56, color: Colors.grey),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text('${snap.error}', textAlign: TextAlign.center),
              ),
              Center(child: FilledButton.tonal(onPressed: reload, child: const Text('Coba lagi'))),
            ]),
          );
        }
        return RefreshIndicator(onRefresh: reload, child: widget.builder(context, snap.data as T, reload));
      },
    );
  }
}

class SectionTitle extends StatelessWidget {
  final String title;
  final Widget? trailing;
  const SectionTitle(this.title, {super.key, this.trailing});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(4, 20, 4, 8),
        child: Row(children: [
          Expanded(child: Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold))),
          ?trailing,
        ]),
      );
}

class EmptyState extends StatelessWidget {
  final String message;
  final IconData icon;
  const EmptyState(this.message, {super.key, this.icon = Icons.inbox_outlined});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 32),
        child: Column(children: [
          Icon(icon, size: 48, color: Colors.grey),
          const SizedBox(height: 8),
          Text(message, textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey)),
        ]),
      );
}

/// Warna jenis kelas, sama dengan legenda versi web: reguler biru, private hijau, online ungu.
Color classTypeColor(dynamic type) => switch ('${type ?? ''}'.toUpperCase()) {
      'PRIVATE' => const Color(0xFF10B981),
      'ONLINE' => const Color(0xFF8B5CF6),
      _ => const Color(0xFF3B82F6),
    };

/// Banner pembuka beranda tiap portal: gradasi warna merek, sapaan, dan tanggal hari ini.
class HeroBanner extends StatelessWidget {
  final String title;
  final String? subtitle;
  final List<Color> colors;
  const HeroBanner({super.key, required this.title, this.subtitle, this.colors = const [Color(0xFF4338CA), Color(0xFF2563EB)]});

  @override
  Widget build(BuildContext context) {
    final today = DateFormat('EEEE, d MMMM yyyy', 'id_ID').format(DateTime.now());
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: LinearGradient(colors: colors, begin: Alignment.topLeft, end: Alignment.bottomRight),
        boxShadow: [BoxShadow(color: colors.first.withValues(alpha: .25), blurRadius: 14, offset: const Offset(0, 6))],
      ),
      child: Stack(children: [
        Positioned(right: -20, top: -30, child: CircleAvatar(radius: 46, backgroundColor: Colors.white.withValues(alpha: .10))),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(today.toUpperCase(), style: TextStyle(color: Colors.white.withValues(alpha: .75), fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: .8)),
          const SizedBox(height: 4),
          Text(title, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
          if (subtitle != null) ...[
            const SizedBox(height: 2),
            Text(subtitle!, style: TextStyle(color: Colors.white.withValues(alpha: .85), fontSize: 13)),
          ],
        ]),
      ]),
    );
  }
}

class StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  const StatCard({super.key, required this.label, required this.value, required this.icon, this.color = Colors.blue});

  // Kartu berwarna lembut: latar gradasi tipis, ikon berlatar warna solid, angka berwarna
  @override
  Widget build(BuildContext context) => Card(
        clipBehavior: Clip.antiAlias,
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [color.withValues(alpha: .14), color.withValues(alpha: .04)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          padding: const EdgeInsets.all(12),
          child: Row(children: [
            Container(
              padding: const EdgeInsets.all(9),
              decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: color), overflow: TextOverflow.ellipsis),
                Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey), overflow: TextOverflow.ellipsis),
              ]),
            ),
          ]),
        ),
      );
}

/// Dua kartu statistik per baris.
class StatGrid extends StatelessWidget {
  final List<Widget> children;
  const StatGrid(this.children, {super.key});

  @override
  Widget build(BuildContext context) {
    final rows = <Widget>[];
    for (var i = 0; i < children.length; i += 2) {
      rows.add(Row(children: [
        Expanded(child: children[i]),
        Expanded(child: i + 1 < children.length ? children[i + 1] : const SizedBox()),
      ]));
    }
    return Column(children: rows);
  }
}

class InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const InfoRow(this.label, this.value, {super.key});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SizedBox(width: 130, child: Text(label, style: const TextStyle(color: Colors.grey))),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500))),
        ]),
      );
}

/// Kartu sesi jadwal yang dipakai ketiga portal.
class SessionCard extends StatelessWidget {
  final Map session;
  final VoidCallback? onTap;
  final Widget? footer;
  final bool showDate;
  const SessionCard(this.session, {super.key, this.onTap, this.footer, this.showDate = true});

  @override
  Widget build(BuildContext context) {
    final s = session;
    final place = [s['location_name'] ?? s['location'], s['room_name']].where((e) => e != null && '$e'.isNotEmpty).join(' • ');
    final accent = classTypeColor(s['class_type']);
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(border: Border(left: BorderSide(color: accent, width: 5))),
          padding: const EdgeInsets.all(14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(
                child: Text(text(s['subject_name']), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
              StatusChip(s['status']),
            ]),
            const SizedBox(height: 6),
            Text([
              if (showDate) tanggal(s['session_date']),
              '${text(s['start_time'] ?? s['time'])} - ${text(s['end_time'])}',
            ].join('  •  ')),
            const SizedBox(height: 2),
            Text(
              [text(s['class_name']), if (s['tentor_name'] != null) s['tentor_name'], if (place.isNotEmpty) place].join(' • '),
              style: const TextStyle(color: Colors.grey, fontSize: 13),
            ),
            if (s['meeting_url'] != null && '${s['meeting_url']}'.isNotEmpty)
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton.icon(
                  onPressed: () => openUrl(context, s['meeting_url']),
                  icon: const Icon(Icons.videocam_outlined, size: 18),
                  label: const Text('Buka link meeting'),
                ),
              ),
            ?footer,
          ]),
        ),
      ),
    );
  }
}

/// Pilih rentang tanggal jadwal (maks. 62 hari, sesuai batas API).
class WeekNavigator extends StatelessWidget {
  final DateTime from;
  final ValueChanged<DateTime> onChanged;
  const WeekNavigator({super.key, required this.from, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final to = from.add(const Duration(days: 6));
    return Row(children: [
      IconButton(onPressed: () => onChanged(from.subtract(const Duration(days: 7))), icon: const Icon(Icons.chevron_left)),
      Expanded(
        child: Text('${tanggal(ymd(from), withDay: false)} - ${tanggal(ymd(to), withDay: false)}',
            textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w600)),
      ),
      IconButton(onPressed: () => onChanged(from.add(const Duration(days: 7))), icon: const Icon(Icons.chevron_right)),
    ]);
  }
}

DateTime startOfWeek(DateTime d) => DateTime(d.year, d.month, d.day).subtract(Duration(days: d.weekday - 1));

/// Dialog ganti password (endpoint per portal).
Future<void> showChangePassword(BuildContext context, Future<void> Function(Map<String, dynamic> body) submit) {
  final current = TextEditingController();
  final password = TextEditingController();
  final confirm = TextEditingController();
  var saving = false;

  return showDialog(
    context: context,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setState) => AlertDialog(
        title: const Text('Ganti Password'),
        content: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            TextField(controller: current, obscureText: true, decoration: const InputDecoration(labelText: 'Password lama')),
            TextField(controller: password, obscureText: true, decoration: const InputDecoration(labelText: 'Password baru')),
            TextField(controller: confirm, obscureText: true, decoration: const InputDecoration(labelText: 'Ulangi password baru')),
          ]),
        ),
        actions: [
          TextButton(onPressed: saving ? null : () => Navigator.pop(ctx), child: const Text('Batal')),
          FilledButton(
            onPressed: saving
                ? null
                : () async {
                    setState(() => saving = true);
                    try {
                      await submit({
                        'current_password': current.text,
                        'password': password.text,
                        'password_confirmation': confirm.text,
                      });
                      if (ctx.mounted) Navigator.pop(ctx);
                      if (context.mounted) showSnack(context, 'Password diperbarui.');
                    } catch (e) {
                      if (ctx.mounted) showSnack(ctx, '$e', error: true);
                      setState(() => saving = false);
                    }
                  },
            child: const Text('Simpan'),
          ),
        ],
      ),
    ),
  );
}
