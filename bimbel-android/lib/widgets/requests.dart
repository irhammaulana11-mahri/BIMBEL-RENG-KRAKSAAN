import 'package:flutter/material.dart';

import '../api/api_client.dart';
import 'common.dart';
import 'location.dart';

/// Form pengajuan pindah jadwal (tanggal & jam baru + alasan). [submit] mengirim body ke API
/// dan mengembalikan pesan sukses; error ditampilkan tanpa menutup dialog.
Future<bool?> showRescheduleDialog(BuildContext context, Map session, Future<String?> Function(DateTime date, TimeOfDay time, String reason) submit) {
  DateTime? date;
  TimeOfDay? time;
  final reason = TextEditingController();
  var sending = false;

  return showDialog<bool>(
    context: context,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setState) => AlertDialog(
        title: const Text('Ajukan Pindah Jadwal'),
        content: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('${text(session['subject_name'])} • ${tanggal(session['session_date'])} ${text(session['start_time'])}'),
            const SizedBox(height: 4),
            const Text('Pengajuan masuk ke Admin untuk disetujui.', style: TextStyle(fontSize: 12, color: Colors.grey)),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.event),
              title: Text(date == null ? 'Pilih tanggal baru' : tanggal(ymd(date!))),
              onTap: () async {
                final now = DateTime.now();
                final d = await showDatePicker(context: ctx, firstDate: now, lastDate: now.add(const Duration(days: 90)), initialDate: now);
                if (d != null) setState(() => date = d);
              },
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.schedule),
              title: Text(time == null ? 'Pilih jam mulai' : time!.format(ctx)),
              onTap: () async {
                final t = await showTimePicker(context: ctx, initialTime: const TimeOfDay(hour: 15, minute: 0));
                if (t != null) setState(() => time = t);
              },
            ),
            TextField(controller: reason, maxLines: 3, decoration: const InputDecoration(labelText: 'Alasan')),
          ]),
        ),
        actions: [
          TextButton(onPressed: sending ? null : () => Navigator.pop(ctx), child: const Text('Batal')),
          FilledButton(
            onPressed: sending
                ? null
                : () async {
                    if (date == null || time == null) return showSnack(ctx, 'Tanggal dan jam wajib dipilih.', error: true);
                    setState(() => sending = true);
                    try {
                      final message = await submit(date!, time!, reason.text.trim());
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

String hhmm(TimeOfDay t) => '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

/// Riwayat pengajuan pindah jadwal & lokasi sementara milik pengguna ([prefix]: '/tentor' atau '/parent').
class MyRequestsScreen extends StatefulWidget {
  final String prefix;
  const MyRequestsScreen(this.prefix, {super.key});

  @override
  State<MyRequestsScreen> createState() => _MyRequestsScreenState();
}

class _MyRequestsScreenState extends State<MyRequestsScreen> {
  final _key = GlobalKey<AsyncViewState>();

  Future<void> _cancel(String path) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        content: const Text('Batalkan pengajuan ini?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Tidak')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Batalkan')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      final res = await api.patch(path);
      if (mounted) showSnack(context, text(res['message'], 'Pengajuan dibatalkan.'));
      await _key.currentState?.reload();
    } catch (e) {
      if (mounted) showSnack(context, '$e', error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Pengajuan Saya'),
          bottom: const TabBar(tabs: [Tab(text: 'Pindah jadwal'), Tab(text: 'Lokasi sementara')]),
        ),
        body: AsyncView<Map>(
          key: _key,
          load: () async {
            final r = await Future.wait([
              api.get('${widget.prefix}/reschedule-requests'),
              api.get('${widget.prefix}/location-requests'),
            ]);
            return {'reschedule': r[0]['data'], 'location': r[1]['data']};
          },
          builder: (context, d, _) => TabBarView(children: [
            _list(d['reschedule'] as List? ?? [], (r) => [
                  'Semula ${tanggal(r['original_date'], withDay: false)} ${text(r['original_start_time'])}',
                  'Usulan ${tanggal(r['proposed_date'], withDay: false)} ${text(r['proposed_start_time'])}-${text(r['proposed_end_time'])}',
                ], 'reschedule-requests'),
            _list(d['location'] as List? ?? [], (r) => [
                  'Sesi ${tanggal(r['session']?['session_date'], withDay: false)} ${text(r['session']?['start_time'])}',
                  '${text(r['location_name'])} • ${text(r['address'])}',
                ], 'location-requests', mapOf: (r) => mapsUrl(r['latitude'], r['longitude'])),
          ]),
        ),
      ),
    );
  }

  Widget _list(List items, List<String> Function(Map r) lines, String path, {String Function(Map r)? mapOf}) {
    if (items.isEmpty) return const EmptyState('Belum ada pengajuan.', icon: Icons.inbox_outlined);
    return ListView(padding: const EdgeInsets.all(12), children: [
      for (final r in items)
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(
                  child: Text('${text(r['session']?['subject_name'])} • ${text(r['session']?['class_name'])}',
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
                StatusChip(r['status']),
              ]),
              const SizedBox(height: 4),
              for (final l in lines(r as Map)) Text(l, style: const TextStyle(fontSize: 13)),
              Text('Alasan: ${text(r['reason'])}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
              if (r['review_note'] != null)
                Text('Catatan Admin: ${r['review_note']}',
                    style: TextStyle(fontSize: 12, color: r['status'] == 'REJECTED' ? Colors.red : Colors.green.shade700)),
              Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                if (mapOf != null) TextButton(onPressed: () => openUrl(context, mapOf(r)), child: const Text('Lihat peta')),
                if (r['status'] == 'PENDING')
                  TextButton(
                    style: TextButton.styleFrom(foregroundColor: Colors.red),
                    onPressed: () => _cancel('${widget.prefix}/$path/${r['id']}/cancel'),
                    child: const Text('Batalkan'),
                  ),
              ]),
            ]),
          ),
        ),
    ]);
  }
}
