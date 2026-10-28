import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';
import '../../widgets/location.dart';
import 'admin_finance.dart' show askReason, runAction;

/// Pengajuan pindah jadwal, lokasi les sementara & pendaftaran anak dari orang tua/tentor.
/// Disetujui sesuai usulan; mengubah jam/tentor atau menempatkan kelas tetap lewat web.
class AdminRequestsTab extends StatefulWidget {
  const AdminRequestsTab({super.key});

  @override
  State<AdminRequestsTab> createState() => _AdminRequestsTabState();
}

class _AdminRequestsTabState extends State<AdminRequestsTab> {
  String _type = 'reschedule';
  String _status = 'PENDING';

  String get _path => switch (_type) {
        'reschedule' => '/admin/reschedule-requests',
        'location' => '/admin/location-requests',
        _ => '/admin/student-registrations',
      };

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
        child: SegmentedButton<String>(
          segments: const [
            ButtonSegment(value: 'reschedule', label: Text('Jadwal'), icon: Icon(Icons.event_repeat)),
            ButtonSegment(value: 'location', label: Text('Lokasi'), icon: Icon(Icons.edit_location_alt_outlined)),
            ButtonSegment(value: 'registration', label: Text('Daftar'), icon: Icon(Icons.person_add_alt)),
          ],
          selected: {_type},
          onSelectionChanged: (v) => setState(() => _type = v.first),
        ),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Wrap(spacing: 8, children: [
          for (final s in const [('PENDING', 'Menunggu'), ('APPROVED', 'Disetujui'), ('REJECTED', 'Ditolak')])
            ChoiceChip(label: Text(s.$2), selected: _status == s.$1, onSelected: (_) => setState(() => _status = s.$1)),
        ]),
      ),
      Expanded(
        child: AsyncView<Map>(
          key: ValueKey('$_type|$_status'),
          load: () async => await api.get(_path, query: {'status': _status}),
          builder: (context, res, reload) {
            final items = res['data'] as List? ?? [];
            return ListView(padding: const EdgeInsets.fromLTRB(12, 0, 12, 12), children: [
              if (items.isEmpty) const EmptyState('Tidak ada pengajuan.'),
              for (final r in items)
                switch (_type) {
                  'reschedule' => _RescheduleCard(r, onChanged: reload),
                  'location' => _LocationCard(r, onChanged: reload),
                  _ => _RegistrationCard(r, onChanged: reload),
                },
            ]);
          },
        ),
      ),
    ]);
  }
}

/// Tombol Tolak / Setujui untuk pengajuan yang masih menunggu.
class _ReviewButtons extends StatefulWidget {
  final String basePath;
  final String approveQuestion;
  final bool canApprove;
  final VoidCallback onDone;
  const _ReviewButtons({required this.basePath, required this.approveQuestion, required this.onDone, this.canApprove = true});

  @override
  State<_ReviewButtons> createState() => _ReviewButtonsState();
}

class _ReviewButtonsState extends State<_ReviewButtons> {
  bool _busy = false;

  Future<void> _run(Future<dynamic> Function() action, String fallback) async {
    setState(() => _busy = true);
    final ok = await runAction(context, action, fallback);
    if (!mounted) return;
    setState(() => _busy = false);
    if (ok) widget.onDone();
  }

  Future<void> _approve() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Setujui pengajuan'),
        content: Text(widget.approveQuestion),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Setujui')),
        ],
      ),
    );
    if (ok == true) await _run(() => api.patch('${widget.basePath}/approve'), 'Pengajuan disetujui.');
  }

  Future<void> _reject() async {
    final reason = await askReason(context, 'Tolak pengajuan');
    if (reason != null) await _run(() => api.patch('${widget.basePath}/reject', {'review_note': reason}), 'Pengajuan ditolak.');
  }

  @override
  Widget build(BuildContext context) {
    return Row(mainAxisAlignment: MainAxisAlignment.end, children: [
      TextButton(
        onPressed: _busy ? null : _reject,
        style: TextButton.styleFrom(foregroundColor: Colors.red),
        child: const Text('Tolak'),
      ),
      const SizedBox(width: 8),
      FilledButton(onPressed: _busy || !widget.canApprove ? null : _approve, child: const Text('Setujui')),
    ]);
  }
}

class _RescheduleCard extends StatelessWidget {
  final Map r;
  final VoidCallback onChanged;
  const _RescheduleCard(this.r, {required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final s = r['session'] ?? {};
    final proposed = '${tanggal(r['proposed_date'])}, ${text(r['proposed_start_time'])} - ${text(r['proposed_end_time'])}';
    final pending = r['status'] == 'PENDING';
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(
              child: Text('${text(s['subject_name'])} • ${text(s['class_name'])}', style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
            StatusChip(r['status']),
          ]),
          const SizedBox(height: 6),
          InfoRow('Diajukan', '${text(r['requester_name'])} (${r['requester_type'] == 'TENTOR' ? 'tentor' : 'orang tua'})'),
          if (r['student_name'] != null) InfoRow('Siswa', text(r['student_name'])),
          InfoRow('Tentor', text(s['tentor_name'])),
          InfoRow('Jadwal semula', '${tanggal(r['original_date'])}, ${text(r['original_start_time'])}'),
          InfoRow('Usulan', proposed),
          InfoRow('Alasan', text(r['reason'])),
          if (r['review_note'] != null) InfoRow('Catatan admin', text(r['review_note'])),
          if (pending) ...[
            // Hasil cek bentrok terkini (tentor, kelas, siswa di kelas lain, ruang)
            if ((r['conflicts'] as List? ?? []).isNotEmpty)
              Container(
                width: double.infinity,
                margin: const EdgeInsets.only(top: 6),
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.red.withValues(alpha: .08), borderRadius: BorderRadius.circular(10)),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Jam usulan bentrok. Tolak, atau setujui dengan jam lain lewat versi web.',
                      style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 12)),
                  for (final c in r['conflicts'] as List) Text('• $c', style: const TextStyle(color: Colors.red, fontSize: 12)),
                ]),
              )
            else if (r['can_approve'] == false)
              const Text('Sesi sudah berlangsung/selesai/dibatalkan, pengajuan hanya bisa ditolak.',
                  style: TextStyle(color: Colors.orange, fontSize: 12))
            else
              Text('Tidak bentrok', style: TextStyle(color: Colors.green.shade700, fontSize: 12, fontWeight: FontWeight.w600)),
            _ReviewButtons(
              basePath: '/admin/reschedule-requests/${r['id']}',
              approveQuestion: 'Pindahkan sesi ke $proposed?',
              // Android menyetujui sesuai usulan apa adanya, jadi usulan yang bentrok tidak bisa disetujui di sini
              canApprove: r['can_approve'] != false && (r['conflicts'] as List? ?? []).isEmpty,
              onDone: onChanged,
            ),
          ],
        ]),
      ),
    );
  }
}

class _RegistrationCard extends StatelessWidget {
  final Map r;
  final VoidCallback onChanged;
  const _RegistrationCard(this.r, {required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final parent = r['parent'] ?? {};
    final student = r['student'];
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(text(r['full_name']), style: const TextStyle(fontWeight: FontWeight.bold))),
            StatusChip(r['status']),
          ]),
          const SizedBox(height: 6),
          InfoRow('Orang tua', '${text(parent['name'])}\n${text(parent['phone'])}'),
          InfoRow('Jenis kelamin', r['gender'] == 'L' ? 'Laki-laki' : r['gender'] == 'P' ? 'Perempuan' : text(r['gender'])),
          InfoRow('Tanggal lahir', tanggal(r['birth_date'], withDay: false)),
          InfoRow('Sekolah', text(r['school_name'])),
          InfoRow('Jenjang', label(r['education_level'])),
          InfoRow('Paket', label(r['package'])),
          InfoRow('Catatan', text(r['note'])),
          InfoRow('Diajukan', text(r['created_at'])),
          if (student != null) InfoRow('Siswa dibuat', '${text(student['name'])} (${text(student['nis'])})'),
          if (r['class_name'] != null) InfoRow('Kelas', text(r['class_name'])),
          if (r['review_note'] != null) InfoRow('Catatan admin', text(r['review_note'])),
          if (r['status'] == 'PENDING')
            _ReviewButtons(
              basePath: '/admin/student-registrations/${r['id']}',
              approveQuestion: 'Buat data siswa ${text(r['full_name'])}? Penempatan ke kelas dilakukan lewat menu Kelas di web.',
              onDone: onChanged,
            ),
        ]),
      ),
    );
  }
}

class _LocationCard extends StatelessWidget {
  final Map r;
  final VoidCallback onChanged;
  const _LocationCard(this.r, {required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final s = r['session'] ?? {};
    final pending = r['status'] == 'PENDING';
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(
              child: Text('${text(s['subject_name'])} • ${text(s['class_name'])}', style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
            StatusChip(r['status']),
          ]),
          const SizedBox(height: 6),
          InfoRow('Diajukan', '${text(r['requester_name'])} (${r['requester_type'] == 'TENTOR' ? 'tentor' : 'orang tua'})'),
          if (r['student_name'] != null) InfoRow('Siswa', text(r['student_name'])),
          InfoRow('Tentor', text(s['tentor_name'])),
          InfoRow('Sesi', '${tanggal(s['session_date'])}, ${text(s['start_time'])} - ${text(s['end_time'])}'),
          if (s['current_location'] != null) InfoRow('Lokasi semula', text(s['current_location'])),
          InfoRow('Lokasi usulan', '${text(r['location_name'])}\n${text(r['address'])}'),
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              onPressed: () => openUrl(context, mapsUrl(r['latitude'], r['longitude'])),
              icon: const Icon(Icons.map_outlined, size: 18),
              label: const Text('Lihat titik di peta'),
            ),
          ),
          InfoRow('Alasan', text(r['reason'])),
          if (r['review_note'] != null) InfoRow('Catatan admin', text(r['review_note'])),
          if (pending) ...[
            if (r['can_approve'] == false)
              const Text('Sesi sudah dimulai/selesai/dibatalkan, pengajuan hanya bisa ditolak.',
                  style: TextStyle(color: Colors.orange, fontSize: 12)),
            _ReviewButtons(
              basePath: '/admin/location-requests/${r['id']}',
              approveQuestion: 'Jadikan "${text(r['location_name'])}" titik absen tentor untuk sesi ini?',
              canApprove: r['can_approve'] != false,
              onDone: onChanged,
            ),
          ],
        ]),
      ),
    );
  }
}
