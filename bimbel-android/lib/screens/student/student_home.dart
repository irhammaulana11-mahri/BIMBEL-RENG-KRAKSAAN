import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';
import '../../widgets/portal_shell.dart';
import '../reports_screen.dart';
import 'student_exams.dart';
import 'student_learning.dart';

class StudentHome extends StatelessWidget {
  const StudentHome({super.key});

  @override
  Widget build(BuildContext context) {
    return const PortalShell(portalName: 'Siswa', tabs: [
      PortalTab('Beranda', Icons.home_outlined, _DashboardTab()),
      PortalTab('Jadwal', Icons.calendar_month_outlined, _ScheduleTab()),
      PortalTab('Ujian', Icons.assignment_outlined, StudentExamsTab()),
      PortalTab('Materi', Icons.menu_book_outlined, StudentMaterialsTab()),
      PortalTab('Profil', Icons.person_outline, _ProfileTab()),
    ]);
  }
}

void _openSession(BuildContext context, Map s) =>
    Navigator.push(context, MaterialPageRoute(builder: (_) => StudentSessionDetailScreen(s['id'])));

class _DashboardTab extends StatelessWidget {
  const _DashboardTab();

  @override
  Widget build(BuildContext context) {
    return AsyncView<Map>(
      load: () async => (await api.get('/student/dashboard'))['data'],
      builder: (context, d, _) {
        final att = d['attendance'] ?? {};
        final today = d['today_sessions'] as List? ?? [];
        final upcoming = d['upcoming_sessions'] as List? ?? [];
        final materials = d['recent_materials'] as List? ?? [];
        final classes = d['classes'] as List? ?? [];
        return ListView(padding: const EdgeInsets.all(12), children: [
          Text('Halo, ${text(d['student']?['name'])}', style: Theme.of(context).textTheme.titleLarge),
          Text('NIS ${text(d['student']?['nis'])}', style: const TextStyle(color: Colors.grey)),
          const SizedBox(height: 12),
          StatGrid([
            StatCard(
                label: 'Kehadiran ${text(att['period'], '')}',
                value: '${att['percentage'] ?? 0}%',
                icon: Icons.fact_check_outlined,
                color: Colors.green),
            StatCard(label: 'Kelas diikuti', value: '${classes.length}', icon: Icons.groups_outlined),
          ]),
          const SectionTitle('Jadwal hari ini'),
          if (today.isEmpty) const EmptyState('Tidak ada sesi hari ini.', icon: Icons.event_available),
          for (final s in today) SessionCard(s, showDate: false, onTap: () => _openSession(context, s)),
          const SectionTitle('7 hari ke depan'),
          if (upcoming.isEmpty) const EmptyState('Belum ada jadwal mendatang.'),
          for (final s in upcoming) SessionCard(s, onTap: () => _openSession(context, s)),
          if (materials.isNotEmpty) ...[
            const SectionTitle('Materi terakhir dibahas'),
            Card(child: Column(children: [for (final m in materials) MaterialTile(m)])),
          ],
        ]);
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
  DateTime _from = startOfWeek(DateTime.now());

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      WeekNavigator(from: _from, onChanged: (d) => setState(() => _from = d)),
      Expanded(
        child: AsyncView<List>(
          key: ValueKey(_from),
          load: () async => (await api.get('/student/sessions',
              query: {'from': ymd(_from), 'to': ymd(_from.add(const Duration(days: 6)))}))['data'],
          builder: (context, sessions, _) => ListView(padding: const EdgeInsets.symmetric(horizontal: 12), children: [
            if (sessions.isEmpty) const EmptyState('Tidak ada sesi pada minggu ini.', icon: Icons.event_busy),
            for (final s in sessions)
              SessionCard(
                s,
                onTap: () => _openSession(context, s),
                footer: s['attendance_status'] == null
                    ? null
                    : Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Row(children: [const Text('Kehadiran: '), StatusChip(s['attendance_status'])]),
                      ),
              ),
          ]),
        ),
      ),
    ]);
  }
}

class _ProfileTab extends StatelessWidget {
  const _ProfileTab();

  @override
  Widget build(BuildContext context) {
    return AsyncView<Map>(
      load: () async => (await api.get('/student/profile'))['data'],
      builder: (context, p, _) {
        final classes = p['classes'] as List? ?? [];
        final parents = p['parents'] as List? ?? [];
        return ListView(padding: const EdgeInsets.all(12), children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(children: [
                InfoRow('Nama', text(p['name'])),
                InfoRow('NIS', text(p['nis'])),
                InfoRow('Email', text(p['email'])),
                InfoRow('No. HP', text(p['phone'])),
                InfoRow('Sekolah', text(p['school_name'])),
                InfoRow('Jenjang', text(p['education_level'])),
                InfoRow('Tanggal lahir', tanggal(p['birth_date'], withDay: false)),
              ]),
            ),
          ),
          if (classes.isNotEmpty) ...[
            const SectionTitle('Kelas'),
            for (final c in classes)
              Card(child: ListTile(title: Text(text(c['name'])), subtitle: Text(text(c['package_name'])))),
          ],
          if (parents.isNotEmpty) ...[
            const SectionTitle('Orang tua / wali'),
            for (final o in parents)
              Card(
                child: ListTile(title: Text(text(o['name'])), subtitle: Text('${text(o['relationship'])} • ${text(o['phone'])}')),
              ),
          ],
          const SizedBox(height: 12),
          Card(
            child: Column(children: [
              ListTile(
                leading: const Icon(Icons.description_outlined),
                title: const Text('Rapor perkembangan'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.push(
                    context, MaterialPageRoute(builder: (_) => const ReportsScreen(basePath: '/student/progress-reports'))),
              ),
              ListTile(
                leading: const Icon(Icons.lock_outline),
                title: const Text('Ganti password'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => showChangePassword(context, (body) => api.put('/student/password', body)),
              ),
            ]),
          ),
        ]);
      },
    );
  }
}
