import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';
import '../../widgets/file_opener.dart';
import '../../widgets/portal_shell.dart';
import '../student/student_exams.dart' show ExamResultView;
import 'tentor_workspace.dart';
import 'tentor_progress.dart';
import '../../widgets/requests.dart';

class TentorHome extends StatelessWidget {
  const TentorHome({super.key});

  @override
  Widget build(BuildContext context) {
    return const PortalShell(
      portalName: 'Tentor',
      tabs: [
        PortalTab('Beranda', Icons.home_outlined, _DashboardTab()),
        PortalTab('Jadwal', Icons.calendar_month_outlined, _ScheduleTab()),
        PortalTab('Penilaian', Icons.rate_review_outlined, _GradingTab()),
        PortalTab('Honor', Icons.payments_outlined, _HonorTab()),
        PortalTab('Profil', Icons.person_outline, _ProfileTab()),
      ],
    );
  }
}

// Tujuan notifikasi "Perlu perhatian" mengikuti link versi web
Future<void> _openAlert(BuildContext context, Map a, VoidCallback reload) async {
  if (a['session_id'] != null) return _openWorkspace(context, a['session_id'], reload);
  final Widget? page = switch (a['link']) {
    '/tentor/progress' => const TentorProgressScreen(),
    '/tentor/evaluations' => Scaffold(
      appBar: AppBar(title: const Text('Penilaian')),
      body: const _GradingTab(),
    ),
    _ => null,
  };
  if (page == null) return;
  await Navigator.push(context, MaterialPageRoute(builder: (_) => page));
  reload();
}

Future<void> _openWorkspace(BuildContext context, String id, VoidCallback reload) async {
  await Navigator.push(context, MaterialPageRoute(builder: (_) => TentorWorkspaceScreen(id)));
  reload();
}

class _DashboardTab extends StatelessWidget {
  const _DashboardTab();

  @override
  Widget build(BuildContext context) {
    return AsyncView<Map>(
      load: () async => (await api.get('/tentor/dashboard'))['data'],
      builder: (context, d, reload) {
        final sum = d['summary'] ?? {};
        final next = d['next_session'];
        final today = d['today_schedules'] as List? ?? [];
        final alerts = d['needs_attention'] as List? ?? [];
        final recent = d['recent_activities'] as List? ?? [];
        return ListView(
          padding: const EdgeInsets.all(12),
          children: [
            HeroBanner(title: 'Halo, ${text(d['tentor_name'])}', subtitle: 'Siap mengajar hari ini?'),
            const SizedBox(height: 12),
            StatGrid([
              StatCard(label: 'Sesi hari ini', value: '${sum['total'] ?? 0}', icon: Icons.today),
              StatCard(label: 'Selesai', value: '${sum['completed'] ?? 0}', icon: Icons.check_circle_outline, color: Colors.green),
              StatCard(label: 'Akan datang', value: '${sum['upcoming'] ?? 0}', icon: Icons.schedule, color: Colors.orange),
              StatCard(label: 'Sesi minggu ini', value: '${sum['week_total'] ?? 0}', icon: Icons.date_range, color: Colors.purple),
            ]),
            if (next != null) ...[
              const SectionTitle('Sesi berikutnya'),
              SessionCard(next, showDate: false, onTap: () => _openWorkspace(context, next['id'], reload)),
            ],
            if (alerts.isNotEmpty) ...[
              const SectionTitle('Perlu perhatian'),
              for (final a in alerts)
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.warning_amber, color: Colors.orange),
                    title: Text(text(a['type'])),
                    subtitle: Text(text(a['message'])),
                    onTap: () => _openAlert(context, a, reload),
                  ),
                ),
            ],
            const SectionTitle('Jadwal hari ini'),
            if (today.isEmpty) const EmptyState('Tidak ada sesi hari ini.', icon: Icons.event_available),
            for (final s in today)
              SessionCard(
                s,
                showDate: false,
                onTap: () => _openWorkspace(context, s['id'], reload),
                footer: Text(
                  'Absensi ${s['attendance_filled'] ?? 0}/${s['students_count'] ?? 0} • ${s['activities_count'] ?? 0} aktivitas',
                  style: const TextStyle(fontSize: 13),
                ),
              ),
            if (recent.isNotEmpty) ...[
              const SectionTitle('Aktivitas terakhir'),
              Card(
                child: Column(
                  children: [for (final r in recent) ListTile(dense: true, title: Text(text(r['message'])), subtitle: Text(text(r['at'])))],
                ),
              ),
            ],
          ],
        );
      },
    );
  }
}

class _ScheduleTab extends StatefulWidget {
  const _ScheduleTab();

  @override
  State<_ScheduleTab> createState() => _ScheduleTabState();
}

class _ScheduleTabState extends State<_ScheduleTab> {
  String _mode = 'minggu_ini';
  DateTime _month = DateTime.now();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
          child: SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'hari_ini', label: Text('Hari ini')),
              ButtonSegment(value: 'minggu_ini', label: Text('Minggu ini')),
              ButtonSegment(value: 'bulanan', label: Text('Bulanan')),
            ],
            selected: {_mode},
            onSelectionChanged: (v) => setState(() => _mode = v.first),
          ),
        ),
        if (_mode == 'bulanan')
          Row(
            children: [
              IconButton(
                onPressed: () => setState(() => _month = DateTime(_month.year, _month.month - 1)),
                icon: const Icon(Icons.chevron_left),
              ),
              Expanded(child: Text(periode(_month.month, _month.year), textAlign: TextAlign.center)),
              IconButton(
                onPressed: () => setState(() => _month = DateTime(_month.year, _month.month + 1)),
                icon: const Icon(Icons.chevron_right),
              ),
            ],
          ),
        Expanded(
          child: AsyncView<List>(
            key: ValueKey('$_mode${_month.year}-${_month.month}'),
            load: () async {
              final res = await api.get(
                '/tentor/schedules',
                query: {'filter_mode': _mode, if (_mode == 'bulanan') 'month': '${_month.year}-${_month.month.toString().padLeft(2, '0')}'},
              );
              final data = res['data'];
              return data is Map ? (data['data'] as List? ?? []) : (data as List? ?? []);
            },
            builder: (context, sessions, reload) => ListView(
              padding: const EdgeInsets.all(12),
              children: [
                if (sessions.isEmpty) const EmptyState('Tidak ada sesi.', icon: Icons.event_busy),
                for (final s in sessions)
                  SessionCard(
                    {...s, 'location_name': s['location']},
                    onTap: () => _openWorkspace(context, s['id'], reload),
                    footer: Text(
                      'Pertemuan ${text(s['meeting_no'])} • ${s['total_students'] ?? 0} siswa',
                      style: const TextStyle(fontSize: 13),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/*
|--------------------------------------------------------------------------
| PENILAIAN UJIAN
|--------------------------------------------------------------------------
*/

class _GradingTab extends StatefulWidget {
  const _GradingTab();

  @override
  State<_GradingTab> createState() => _GradingTabState();
}

class _GradingTabState extends State<_GradingTab> {
  String _status = 'SUBMITTED';

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
          child: SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'SUBMITTED', label: Text('Perlu dinilai')),
              ButtonSegment(value: 'GRADED', label: Text('Sudah dinilai')),
            ],
            selected: {_status},
            onSelectionChanged: (v) => setState(() => _status = v.first),
          ),
        ),
        Expanded(
          child: AsyncView<Map>(
            key: ValueKey(_status),
            load: () async => await api.get('/tentor/exam-results', query: {'status': _status}),
            builder: (context, res, reload) {
              final results = res['data'] as List? ?? [];
              final sum = res['summary'] as Map? ?? {};
              return ListView(
                padding: const EdgeInsets.all(12),
                children: [
                  StatGrid([
                    StatCard(label: 'Perlu dinilai', value: '${sum['pending'] ?? 0}', icon: Icons.edit_note, color: Colors.orange),
                    StatCard(label: 'Sudah dinilai', value: '${sum['graded'] ?? 0}', icon: Icons.task_alt, color: Colors.green),
                    StatCard(
                      label: 'Rata-rata nilai',
                      value: '${sum['average'] ?? '-'}',
                      icon: Icons.emoji_events_outlined,
                      color: Colors.indigo,
                    ),
                    StatCard(label: 'Siswa', value: '${sum['students'] ?? 0}', icon: Icons.people_outline, color: Colors.blue),
                  ]),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton.icon(
                      onPressed: results.isEmpty
                          ? null
                          : () => openPrivateFile(context, '/tentor/exam-results/export?status=$_status', 'Rekap Evaluasi'),
                      icon: const Icon(Icons.picture_as_pdf_outlined, size: 18),
                      label: const Text('Export PDF'),
                    ),
                  ),
                  if (results.isEmpty) const EmptyState('Tidak ada jawaban ujian.', icon: Icons.rate_review_outlined),
                  for (final r in results)
                    Card(
                      child: ListTile(
                        title: Text(text(r['student_name'])),
                        subtitle: Text('${text(r['exam_title'])}\n${text(r['class_name'])} • ${text(r['submitted_at'])}'),
                        isThreeLine: true,
                        trailing: r['status'] == 'GRADED'
                            ? Text('${r['score']}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold))
                            : StatusChip(r['status']),
                        onTap: () async {
                          await Navigator.push(context, MaterialPageRoute(builder: (_) => _GradeScreen(r['id'])));
                          reload();
                        },
                      ),
                    ),
                ],
              );
            },
          ),
        ),
      ],
    );
  }
}

class _GradeScreen extends StatefulWidget {
  final String resultId;
  const _GradeScreen(this.resultId);

  @override
  State<_GradeScreen> createState() => _GradeScreenState();
}

class _GradeScreenState extends State<_GradeScreen> {
  final _scores = <String, TextEditingController>{};
  final _feedbacks = <String, TextEditingController>{};
  final _overall = TextEditingController();
  bool _saving = false;
  bool _initialized = false;

  bool _gradable(Map a) => a['answer_id'] != null && a['question_type'] == 'ESSAY';

  Future<void> _save(List answers) async {
    setState(() => _saving = true);
    try {
      final grades = [
        for (final a in answers.where((a) => _gradable(a)))
          {
            'answer_id': a['answer_id'],
            'score': num.tryParse(_scores[a['answer_id']]!.text.replaceAll(',', '.')) ?? 0,
            'feedback': _feedbacks[a['answer_id']]!.text.trim().isEmpty ? null : _feedbacks[a['answer_id']]!.text.trim(),
          },
      ];
      for (final g in grades) {
        final max = answers.firstWhere((a) => a['answer_id'] == g['answer_id'])['max_score'] ?? 0;
        if ((g['score'] as num) > (num.tryParse('$max') ?? 0)) {
          throw ApiException('Nilai tidak boleh melebihi skor maksimal soal ($max).');
        }
      }
      final res = await api.put('/tentor/exam-results/${widget.resultId}/grade', {
        'grades': grades,
        'feedback': _overall.text.trim().isEmpty ? null : _overall.text.trim(),
      });
      if (!mounted) return;
      showSnack(context, text(res['message'], 'Nilai disimpan.'));
      Navigator.pop(context);
    } catch (e) {
      if (mounted) showSnack(context, '$e', error: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Penilaian Ujian')),
      body: AsyncView<Map>(
        load: () async => (await api.get('/tentor/exam-results/${widget.resultId}'))['data'],
        builder: (context, r, _) {
          final answers = r['answers'] as List? ?? [];
          if (!_initialized) {
            _initialized = true;
            _overall.text = r['feedback'] ?? '';
            for (final a in answers.where((a) => _gradable(a))) {
              _scores[a['answer_id']] = TextEditingController(text: a['needs_grading'] == true ? '' : '${a['score'] ?? ''}');
              _feedbacks[a['answer_id']] = TextEditingController(text: a['teacher_feedback'] ?? '');
            }
          }
          return Column(
            children: [
              Expanded(
                child: ExamResultView(
                  r,
                  header: [
                    Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: TextField(
                        controller: _overall,
                        maxLines: 2,
                        decoration: const InputDecoration(labelText: 'Catatan umum untuk siswa (opsional)'),
                      ),
                    ),
                  ],
                  answerFooter: (a) => !_gradable(a)
                      ? const SizedBox()
                      : Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              SizedBox(
                                width: 110,
                                child: TextField(
                                  controller: _scores[a['answer_id']],
                                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                  decoration: InputDecoration(labelText: 'Nilai', suffixText: '/${a['max_score']}', isDense: true),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: TextField(
                                  controller: _feedbacks[a['answer_id']],
                                  decoration: const InputDecoration(labelText: 'Catatan', isDense: true),
                                ),
                              ),
                            ],
                          ),
                        ),
                ),
              ),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: FilledButton(
                    style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                    onPressed: _saving ? null : () => _save(answers),
                    child: const Text('Simpan nilai'),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

/*
|--------------------------------------------------------------------------
| HONOR & PROFIL
|--------------------------------------------------------------------------
*/

class _HonorTab extends StatelessWidget {
  const _HonorTab();

  @override
  Widget build(BuildContext context) {
    return AsyncView<Map>(
      load: () async => (await api.get('/tentor/honor'))['data'],
      builder: (context, d, _) {
        final est = d['estimate'] ?? {};
        final totals = d['totals'] ?? {};
        final history = d['history'] as List? ?? [];
        return ListView(
          padding: const EdgeInsets.all(12),
          children: [
            StatGrid([
              StatCard(label: 'Total pendapatan', value: rupiah(totals['received']), icon: Icons.savings_outlined, color: Colors.green),
              StatCard(
                label: 'Pendapatan ${totals['year'] ?? ''}',
                value: rupiah(totals['received_year']),
                icon: Icons.account_balance_wallet_outlined,
                color: Colors.blue,
              ),
              StatCard(label: 'Menunggu transfer', value: rupiah(totals['awaiting']), icon: Icons.hourglass_bottom, color: Colors.orange),
              StatCard(
                label: 'Estimasi ${text(est['period_label'], '')} (${est['total_sessions'] ?? 0} sesi)',
                value: rupiah(est['total_amount']),
                icon: Icons.trending_up,
                color: Colors.purple,
              ),
            ]),
            const SectionTitle('Riwayat honor'),
            if (history.isEmpty) const EmptyState('Belum ada riwayat honor.', icon: Icons.payments_outlined),
            for (final h in history)
              Card(
                child: ExpansionTile(
                  title: Text(text(h['period_label'])),
                  subtitle: Text('${h['total_sessions']} sesi • ${text(h['payroll_no'])}'),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(rupiah(h['total_amount']), style: const TextStyle(fontWeight: FontWeight.bold)),
                      Text(h['transfer'] != null ? 'Ditransfer' : text(h['payroll_status']), style: const TextStyle(fontSize: 12)),
                    ],
                  ),
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: FilledButton.tonalIcon(
                          onPressed: () =>
                              openPrivateFile(context, '/tentor/honor/${h['payroll_id']}/slip', 'Slip Honor ${text(h['payroll_no'])}'),
                          icon: const Icon(Icons.picture_as_pdf_outlined, size: 18),
                          label: const Text('Unduh slip PDF'),
                        ),
                      ),
                    ),
                    if (h['transfer'] != null)
                      ListTile(
                        dense: true,
                        leading: const Icon(Icons.account_balance),
                        title: Text('Transfer ${tanggal(h['transfer']['transfer_date'], withDay: false)}'),
                        subtitle: Text('Ref. ${text(h['transfer']['reference_no'])}'),
                      ),
                    for (final s in h['sessions'] as List? ?? [])
                      ListTile(
                        dense: true,
                        title: Text('${text(s['subject_name'])} • ${text(s['class_name'])}'),
                        subtitle: Text('${tanggal(s['session_date'])} ${text(s['start_time'])}-${text(s['end_time'])}'),
                        trailing: Text(rupiah(s['subtotal'])),
                      ),
                  ],
                ),
              ),
          ],
        );
      },
    );
  }
}

class _ProfileTab extends StatelessWidget {
  const _ProfileTab();

  @override
  Widget build(BuildContext context) {
    return AsyncView<Map>(
      load: () async => (await api.get('/tentor/profile'))['data'],
      builder: (context, p, _) {
        final subjects = p['subjects'] as List? ?? [];
        final classes = p['classes'] as List? ?? [];
        final stats = p['statistics'] as Map? ?? {};
        return ListView(
          padding: const EdgeInsets.all(12),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    InfoRow('Nama', text(p['name'])),
                    InfoRow('Email', text(p['email'])),
                    InfoRow('No. HP', text(p['phone'])),
                    InfoRow('Spesialisasi', text(p['specialization'])),
                    InfoRow('Pendidikan', text(p['education'])),
                    InfoRow('Bergabung', tanggal(p['joining_date'], withDay: false)),
                  ],
                ),
              ),
            ),
            StatGrid([
              StatCard(label: 'Kelas diampu', value: '${stats['classes'] ?? 0}', icon: Icons.school_outlined, color: Colors.indigo),
              StatCard(label: 'Siswa', value: '${stats['students'] ?? 0}', icon: Icons.people_outline, color: Colors.blue),
              StatCard(label: 'Sesi selesai', value: '${stats['sessions_done'] ?? 0}', icon: Icons.task_alt, color: Colors.green),
              StatCard(
                label: 'Jam mengajar',
                value: '${stats['teaching_hours'] ?? 0} jam',
                icon: Icons.timer_outlined,
                color: Colors.orange,
              ),
            ]),
            if (subjects.isNotEmpty) ...[
              const SectionTitle('Mata pelajaran'),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  for (final s in subjects) Chip(label: Text([s['name'], s['level']].where((e) => e != null).join(' • '))),
                ],
              ),
            ],
            if (classes.isNotEmpty) ...[
              const SectionTitle('Kelas yang diajar'),
              for (final c in classes)
                Card(
                  child: ListTile(title: Text(text(c['name'])), trailing: Text('${c['students_count'] ?? 0} siswa')),
                ),
            ],
            const SizedBox(height: 12),
            Card(
              child: ListTile(
                leading: const Icon(Icons.trending_up),
                title: const Text('Perkembangan Nilai'),
                subtitle: const Text('Catatan perkembangan siswa untuk rapor'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TentorProgressScreen())),
              ),
            ),
            Card(
              child: ListTile(
                leading: const Icon(Icons.assignment_outlined),
                title: const Text('Pengajuan saya'),
                subtitle: const Text('Pindah jadwal & lokasi les sementara'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MyRequestsScreen('/tentor'))),
              ),
            ),
            Card(
              child: ListTile(
                leading: const Icon(Icons.lock_outline),
                title: const Text('Ganti password'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => showChangePassword(context, (body) => api.put('/tentor/password', body)),
              ),
            ),
          ],
        );
      },
    );
  }
}
