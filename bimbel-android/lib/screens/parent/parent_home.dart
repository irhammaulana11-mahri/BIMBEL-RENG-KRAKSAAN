import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';
import '../../widgets/location.dart';
import '../../widgets/portal_shell.dart';
import '../reports_screen.dart';
import 'parent_billing.dart';
import 'parent_registration.dart';
import '../../widgets/requests.dart';

class ParentHome extends StatelessWidget {
  const ParentHome({super.key});

  @override
  Widget build(BuildContext context) {
    return const PortalShell(portalName: 'Orang Tua', tabs: [
      PortalTab('Beranda', Icons.home_outlined, _DashboardTab()),
      PortalTab('Jadwal', Icons.calendar_month_outlined, _ScheduleTab()),
      PortalTab('Tagihan', Icons.receipt_long_outlined, ParentBillingTab()),
      PortalTab('Nilai', Icons.grade_outlined, _GradesTab()),
      PortalTab('Profil', Icons.person_outline, _ProfileTab()),
    ]);
  }
}

String _childNames(Map s) =>
    (s['children'] as List? ?? []).map((c) => c['name']).where((n) => n != null).join(', ');

class _DashboardTab extends StatelessWidget {
  const _DashboardTab();

  @override
  Widget build(BuildContext context) {
    return AsyncView<Map>(
      load: () async => (await api.get('/parent/dashboard'))['data'],
      builder: (context, d, _) {
        final sum = d['summary'] ?? {};
        final today = d['today_sessions'] as List? ?? [];
        final upcoming = d['upcoming_sessions'] as List? ?? [];
        final invoices = d['open_invoices'] as List? ?? [];
        final results = d['recent_results'] as List? ?? [];
        return ListView(padding: const EdgeInsets.all(12), children: [
          HeroBanner(title: 'Halo, ${text(d['parent']?['name'])}', subtitle: 'Pantau jadwal, nilai & tagihan anak.', colors: const [Color(0xFF047857), Color(0xFF0D9488)]),
          const SizedBox(height: 12),
          StatGrid([
            StatCard(label: 'Anak terdaftar', value: '${sum['children_count'] ?? 0}', icon: Icons.family_restroom),
            StatCard(
                label: 'Kehadiran ${text(sum['attendance_period'], '')}',
                value: '${sum['attendance_percentage'] ?? 0}%',
                icon: Icons.fact_check_outlined,
                color: Colors.green),
            StatCard(
                label: '${sum['open_invoices_count'] ?? 0} tagihan belum lunas',
                value: rupiah(sum['outstanding']),
                icon: Icons.account_balance_wallet_outlined,
                color: Colors.red),
            StatCard(
                label: 'Pengajuan menunggu',
                value: '${sum['pending_requests'] ?? 0}',
                icon: Icons.pending_actions_outlined,
                color: Colors.orange),
          ]),
          const SectionTitle('Jadwal hari ini'),
          if (today.isEmpty) const EmptyState('Tidak ada sesi hari ini.', icon: Icons.event_available),
          for (final s in today)
            SessionCard(s, showDate: false, footer: Text('Anak: ${_childNames(s)}', style: const TextStyle(fontSize: 13))),
          const SectionTitle('7 hari ke depan'),
          if (upcoming.isEmpty) const EmptyState('Belum ada jadwal mendatang.'),
          for (final s in upcoming)
            SessionCard(s, footer: Text('Anak: ${_childNames(s)}', style: const TextStyle(fontSize: 13))),
          if (invoices.isNotEmpty) ...[
            const SectionTitle('Tagihan belum lunas'),
            for (final i in invoices)
              Card(
                child: ListTile(
                  title: Text('${text(i['student_name'])} • ${periode(i['period_month'], i['period_year'])}'),
                  subtitle: Text('Jatuh tempo ${tanggal(i['due_date'], withDay: false)}'
                      '${i['is_overdue'] == true ? ' (lewat)' : ''}'),
                  trailing: Text(rupiah(i['remaining_amount']), style: const TextStyle(fontWeight: FontWeight.bold)),
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => InvoiceDetailScreen(i['id']))),
                ),
              ),
          ],
          if (results.isNotEmpty) ...[
            const SectionTitle('Hasil ujian terbaru'),
            for (final r in results) _ResultCard(r),
          ],
        ]);
      },
    );
  }
}

/*
|--------------------------------------------------------------------------
| JADWAL & PINDAH JADWAL
|--------------------------------------------------------------------------
*/

class _ScheduleTab extends StatefulWidget {
  const _ScheduleTab();

  @override
  State<_ScheduleTab> createState() => _ScheduleTabState();
}

class _ScheduleTabState extends State<_ScheduleTab> {
  DateTime _from = startOfWeek(DateTime.now());
  String? _studentId;
  List _children = [];

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      WeekNavigator(from: _from, onChanged: (d) => setState(() => _from = d)),
      if (_children.length > 1)
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Row(children: [
            for (final c in [{'id': null, 'name': 'Semua anak'}, ..._children])
              Padding(
                padding: const EdgeInsets.only(right: 6),
                child: ChoiceChip(
                  label: Text(text(c['name'])),
                  selected: _studentId == c['id'],
                  onSelected: (_) => setState(() => _studentId = c['id']),
                ),
              ),
          ]),
        ),
      Expanded(
        child: AsyncView<List>(
          key: ValueKey('$_from$_studentId'),
          load: () async {
            final res = await api.get('/parent/schedules', query: {
              'from': ymd(_from),
              'to': ymd(_from.add(const Duration(days: 6))),
              'student_id': _studentId,
            });
            final children = res['children'] as List? ?? [];
            if (children.length != _children.length) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (mounted) setState(() => _children = children);
              });
            }
            return res['data'];
          },
          builder: (context, sessions, reload) => ListView(padding: const EdgeInsets.symmetric(horizontal: 12), children: [
            if (sessions.isEmpty) const EmptyState('Tidak ada sesi pada minggu ini.', icon: Icons.event_busy),
            for (final s in sessions)
              SessionCard(s,
                  footer: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const SizedBox(height: 6),
                    for (final c in s['children'] as List? ?? [])
                      Row(children: [
                        Expanded(child: Text(text(c['name']), style: const TextStyle(fontSize: 13))),
                        StatusChip(c['attendance_status'] ?? 'BELUM'),
                      ]),
                    if (s['note'] != null) Text('Catatan: ${s['note']}', style: const TextStyle(fontSize: 13)),
                    if (s['my_request'] != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Row(children: [
                          Expanded(
                            child: Text(
                              'Pindah ke ${tanggal(s['my_request']['proposed_date'], withDay: false)} '
                              '${text(s['my_request']['proposed_start_time'])}',
                              style: const TextStyle(fontSize: 13),
                            ),
                          ),
                          StatusChip(s['my_request']['status']),
                        ]),
                      ),
                    if (s['can_request'] == true)
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton.icon(
                          icon: const Icon(Icons.edit_calendar, size: 18),
                          label: const Text('Ajukan pindah jadwal'),
                          onPressed: () async {
                            if (await _requestReschedule(context, s) == true) reload();
                          },
                        ),
                      ),
                    if (s['my_location_request'] != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Row(children: [
                          Expanded(
                            child: Text('Lokasi sementara: ${text(s['my_location_request']['location_name'])}'
                                '${s['my_location_request']['review_note'] != null ? ' • ${s['my_location_request']['review_note']}' : ''}',
                                style: const TextStyle(fontSize: 13)),
                          ),
                          StatusChip(s['my_location_request']['status']),
                        ]),
                      ),
                    if (s['my_location_request']?['status'] == 'PENDING')
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          style: TextButton.styleFrom(foregroundColor: Colors.red),
                          onPressed: () async {
                            try {
                              final res = await api.patch('/parent/location-requests/${s['my_location_request']['id']}/cancel');
                              if (context.mounted) showSnack(context, text(res['message'], 'Pengajuan dibatalkan.'));
                              reload();
                            } catch (e) {
                              if (context.mounted) showSnack(context, '$e', error: true);
                            }
                          },
                          child: const Text('Batalkan pengajuan lokasi'),
                        ),
                      ),
                    if (s['can_request_location'] == true)
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton.icon(
                          icon: const Icon(Icons.edit_location_alt_outlined, size: 18),
                          label: const Text('Ajukan lokasi les sementara'),
                          onPressed: () async {
                            final children = s['children'] as List? ?? [];
                            final ok = await showLocationRequestDialog(
                                context,
                                s,
                                (body) async => (await api.post('/parent/sessions/${s['id']}/location-requests', {
                                      ...body,
                                      if (children.isNotEmpty) 'student_id': children.first['id'],
                                    }))['message']);
                            if (ok == true) reload();
                          },
                        ),
                      ),
                  ])),
          ]),
        ),
      ),
    ]);
  }
}

Future<bool?> _requestReschedule(BuildContext context, Map session) {
  final children = session['children'] as List? ?? [];
  String? studentId = children.length == 1 ? children.first['id'] : null;
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
            if (children.length > 1)
              DropdownButtonFormField<String>(
                initialValue: studentId,
                decoration: const InputDecoration(labelText: 'Untuk anak'),
                items: [for (final c in children) DropdownMenuItem(value: '${c['id']}', child: Text(text(c['name'])))],
                onChanged: (v) => setState(() => studentId = v),
              ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.event),
              title: Text(date == null ? 'Pilih tanggal baru' : tanggal(ymd(date!))),
              onTap: () async {
                final now = DateTime.now();
                final d = await showDatePicker(
                    context: ctx, firstDate: now, lastDate: now.add(const Duration(days: 90)), initialDate: now);
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
                      final res = await api.post('/parent/sessions/${session['id']}/reschedule-requests', {
                        'student_id': studentId,
                        'proposed_date': ymd(date!),
                        'proposed_start_time':
                            '${time!.hour.toString().padLeft(2, '0')}:${time!.minute.toString().padLeft(2, '0')}',
                        'reason': reason.text.trim(),
                      });
                      if (ctx.mounted) Navigator.pop(ctx, true);
                      if (context.mounted) showSnack(context, text(res['message'], 'Pengajuan terkirim.'));
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

/*
|--------------------------------------------------------------------------
| NILAI UJIAN
|--------------------------------------------------------------------------
*/

class _ResultCard extends StatelessWidget {
  final Map r;
  const _ResultCard(this.r);

  @override
  Widget build(BuildContext context) => Card(
        child: ExpansionTile(
          title: Text(text(r['exam_title'])),
          subtitle: Text('${text(r['student_name'])} • ${text(r['subject_name'])}\n${text(r['submitted_at'])}'),
          trailing: r['score'] != null
              ? Text('${r['score']}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold))
              : StatusChip(r['status']),
          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          children: [
            InfoRow('Nilai', r['score'] != null ? '${r['score']} / ${r['total_score']}' : 'Menunggu penilaian'),
            if (r['total_correct'] != null)
              InfoRow('Jawaban', 'Benar ${r['total_correct']} • Salah ${r['total_wrong']} • Kosong ${r['total_unanswered']}'),
            if (r['class_name'] != null) InfoRow('Kelas', text(r['class_name'])),
            if (r['duration_minutes'] != null) InfoRow('Durasi', '${r['duration_minutes']} menit'),
            if (r['feedback'] != null) InfoRow('Catatan tentor', text(r['feedback'])),
          ],
        ),
      );
}

class _GradesTab extends StatelessWidget {
  const _GradesTab();

  @override
  Widget build(BuildContext context) {
    return AsyncView<List>(
      load: () async => (await api.get('/parent/exam-results'))['data'],
      builder: (context, results, _) => ListView(padding: const EdgeInsets.all(12), children: [
        if (results.isEmpty) const EmptyState('Belum ada hasil ujian.', icon: Icons.grade_outlined),
        for (final r in results) _ResultCard(r),
      ]),
    );
  }
}

/*
|--------------------------------------------------------------------------
| PROFIL
|--------------------------------------------------------------------------
*/

class _ProfileTab extends StatelessWidget {
  const _ProfileTab();

  @override
  Widget build(BuildContext context) {
    return AsyncView<Map>(
      load: () async => (await api.get('/parent/profile'))['data'],
      builder: (context, p, _) {
        final children = p['children'] as List? ?? [];
        return ListView(padding: const EdgeInsets.all(12), children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(children: [
                InfoRow('Nama', text(p['full_name'])),
                InfoRow('Email', text(p['email'])),
                InfoRow('No. HP', text(p['phone'])),
                InfoRow('Hubungan', text(p['relationship'])),
                InfoRow('Pekerjaan', text(p['occupation'])),
                InfoRow('Alamat', text(p['address'])),
              ]),
            ),
          ),
          const SectionTitle('Anak'),
          if (children.isEmpty) const EmptyState('Belum ada anak terdaftar.'),
          for (final c in children)
            Card(
              child: ListTile(
                title: Text(text(c['name'])),
                subtitle: Text([
                  'NIS ${text(c['nis'])} • ${text(c['school_name'])}',
                  ...(c['classes'] as List? ?? []).map((k) => '${k['name']} (${text(k['package_name'])})'),
                ].join('\n')),
                isThreeLine: true,
              ),
            ),
          const SizedBox(height: 12),
          Card(
            child: Column(children: [
              ListTile(
                leading: const Icon(Icons.description_outlined),
                title: const Text('Rapor perkembangan anak'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.push(
                    context, MaterialPageRoute(builder: (_) => const ReportsScreen(basePath: '/parent/progress-reports'))),
              ),
              ListTile(
                leading: const Icon(Icons.person_add_alt),
                title: const Text('Daftarkan anak baru'),
                subtitle: const Text('Disetujui Admin, akun login anak dikirim ke notifikasi'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ParentRegistrationScreen())),
              ),
              ListTile(
                leading: const Icon(Icons.assignment_outlined),
                title: const Text('Pengajuan saya'),
                subtitle: const Text('Pindah jadwal & lokasi les sementara'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MyRequestsScreen('/parent'))),
              ),
              ListTile(
                leading: const Icon(Icons.lock_outline),
                title: const Text('Ganti password'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => showChangePassword(context, (body) => api.put('/parent/password', body)),
              ),
            ]),
          ),
        ]);
      },
    );
  }
}
