import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';

const _attendanceOptions = ['HADIR', 'IZIN', 'SAKIT', 'ALPA'];
const _activityLabels = {'MATERIAL': 'Materi', 'DISCUSSION': 'Diskusi', 'EXAM': 'Ujian', 'REVIEW': 'Review'};

/// Ruang kerja sesi: mulai/akhiri sesi, jalankan aktivitas, dan isi absensi siswa.
class TentorWorkspaceScreen extends StatefulWidget {
  final String sessionId;
  const TentorWorkspaceScreen(this.sessionId, {super.key});

  @override
  State<TentorWorkspaceScreen> createState() => _TentorWorkspaceScreenState();
}

class _TentorWorkspaceScreenState extends State<TentorWorkspaceScreen> {
  final _key = GlobalKey<AsyncViewState>();
  final _attendance = <String, String>{};
  bool _busy = false;

  String get _base => '/tentor/sessions/${widget.sessionId}';

  Future<void> _action(Future<dynamic> Function() call, {String? confirm}) async {
    if (confirm != null) {
      final ok = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          content: Text(confirm),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Ya')),
          ],
        ),
      );
      if (ok != true) return;
    }
    setState(() => _busy = true);
    try {
      final res = await call();
      if (mounted && res is Map && res['message'] != null) showSnack(context, '${res['message']}');
      _attendance.clear();
      await _key.currentState?.reload();
    } catch (e) {
      if (mounted) showSnack(context, '$e', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ruang Kerja Sesi')),
      body: AsyncView<Map>(
        key: _key,
        load: () async => (await api.get('$_base/workspace'))['data'],
        builder: (context, s, _) {
          final status = s['status'];
          final students = s['students'] as List? ?? [];
          final activities = s['activities'] as List? ?? [];
          final ta = s['tentor_attendance'];
          final running = status == 'IN_PROGRESS';
          return ListView(padding: const EdgeInsets.all(12), children: [
            SessionCard({...s, 'location_name': s['location']}),
            if (ta != null)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Text('Check-in ${text(ta['checkin_time'])} • Check-out ${text(ta['checkout_time'])}'
                      '${(ta['late_minutes'] ?? 0) > 0 ? ' • Terlambat ${ta['late_minutes']} mnt' : ''}'),
                ),
              ),
            const SizedBox(height: 8),
            if (status == 'SCHEDULED' || status == 'RESCHEDULED')
              FilledButton.icon(
                onPressed: _busy ? null : () => _action(() => api.post('$_base/start'), confirm: 'Mulai sesi sekarang?'),
                icon: const Icon(Icons.play_arrow),
                label: const Text('Mulai sesi'),
              ),
            if (running)
              FilledButton.tonalIcon(
                onPressed: _busy
                    ? null
                    : () => _action(() => api.post('$_base/end'),
                        confirm: 'Akhiri sesi? Pastikan absensi siswa sudah disimpan.'),
                icon: const Icon(Icons.stop),
                label: const Text('Akhiri sesi'),
              ),
            const SectionTitle('Aktivitas'),
            if (activities.isEmpty) const EmptyState('Belum ada aktivitas. Tambahkan aktivitas lewat versi web.'),
            for (final a in activities)
              Card(
                child: ListTile(
                  title: Text(text(a['title'])),
                  subtitle: Text([
                    _activityLabels[a['type']] ?? text(a['type']),
                    if (a['start_time'] != null) '${a['start_time']} - ${text(a['end_time'])}',
                    if (a['reference_title'] != null) a['reference_title'],
                    if (a['type'] == 'EXAM') '${a['exam_submitted'] ?? 0} terkumpul • ${a['exam_pending'] ?? 0} perlu dinilai',
                  ].join(' • ')),
                  trailing: running && a['status'] == 'READY'
                      ? IconButton(
                          tooltip: 'Mulai',
                          icon: const Icon(Icons.play_circle_outline),
                          onPressed: _busy ? null : () => _action(() => api.patch('$_base/activities/${a['id']}/start')),
                        )
                      : running && a['status'] == 'IN_PROGRESS'
                          ? IconButton(
                              tooltip: 'Selesai',
                              icon: const Icon(Icons.check_circle_outline),
                              onPressed:
                                  _busy ? null : () => _action(() => api.patch('$_base/activities/${a['id']}/complete')),
                            )
                          : StatusChip(a['status']),
                ),
              ),
            SectionTitle('Absensi siswa (${students.length})',
                trailing: students.isEmpty
                    ? null
                    : TextButton(
                        onPressed: () => setState(() {
                          for (final st in students) {
                            _attendance['${st['student_id']}'] = 'HADIR';
                          }
                        }),
                        child: const Text('Semua hadir'),
                      )),
            if (students.isEmpty) const EmptyState('Belum ada siswa di kelas ini.'),
            for (final st in students)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(text(st['full_name']), style: const TextStyle(fontWeight: FontWeight.w600)),
                    Text('NIS ${text(st['nis'])} • ${text(st['school_name'])}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                    const SizedBox(height: 6),
                    Wrap(spacing: 6, children: [
                      for (final opt in _attendanceOptions)
                        ChoiceChip(
                          label: Text(opt[0] + opt.substring(1).toLowerCase()),
                          selected: (_attendance['${st['student_id']}'] ?? st['attendance_status']) == opt,
                          onSelected: (_) => setState(() => _attendance['${st['student_id']}'] = opt),
                        ),
                    ]),
                  ]),
                ),
              ),
            if (students.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                  onPressed: _busy || _attendance.isEmpty
                      ? null
                      : () => _action(() => api.post('$_base/attendance', {
                            'attendances': [
                              for (final st in students)
                                {
                                  'student_id': st['student_id'],
                                  'attendance_status': _attendance['${st['student_id']}'] ?? st['attendance_status'] ?? 'BELUM',
                                  'note': st['note'],
                                }
                            ],
                          })),
                  icon: const Icon(Icons.save),
                  label: const Text('Simpan absensi'),
                ),
              ),
          ]);
        },
      ),
    );
  }
}
