import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';
import '../../widgets/portal_shell.dart';
import 'admin_finance.dart';
import 'admin_requests.dart';

/// Admin versi ringan: tugas harian saja. Data master, jadwal, ujian, rapor & CMS tetap di web.
class AdminHome extends StatelessWidget {
  const AdminHome({super.key});

  @override
  Widget build(BuildContext context) {
    return const PortalShell(portalName: 'Admin', tabs: [
      PortalTab('Beranda', Icons.home_outlined, _DashboardTab()),
      PortalTab('Pembayaran', Icons.payments_outlined, AdminPaymentsTab()),
      PortalTab('Tagihan', Icons.receipt_long_outlined, AdminInvoicesTab()),
      PortalTab('Pengajuan', Icons.inbox_outlined, AdminRequestsTab()),
    ]);
  }
}

class _DashboardTab extends StatelessWidget {
  const _DashboardTab();

  @override
  Widget build(BuildContext context) {
    return AsyncView<Map>(
      load: () async => (await api.get('/admin/dashboard'))['data'],
      builder: (context, d, reload) {
        final stats = d['stats'] ?? {};
        final fin = d['finance'] ?? {};
        final receivables = fin['receivables'] ?? {};
        final inbox = (d['inbox'] as List? ?? []).where((i) => (i['count'] ?? 0) > 0).toList();
        final today = d['today_sessions'] as List? ?? [];
        return ListView(padding: const EdgeInsets.all(12), children: [
          HeroBanner(title: 'Dashboard Admin', subtitle: 'Ringkasan ${text(d['period'])}'),
          const SizedBox(height: 12),
          StatGrid([
            StatCard(label: 'Siswa aktif', value: '${stats['active_students'] ?? 0}', icon: Icons.people_outline),
            StatCard(label: 'Tentor aktif', value: '${stats['active_tentors'] ?? 0}', icon: Icons.school_outlined, color: Colors.purple),
            StatCard(
                label: 'Sesi selesai bulan ini',
                value: '${stats['sessions_done'] ?? 0}/${stats['sessions_month'] ?? 0}',
                icon: Icons.event_available,
                color: Colors.green),
            StatCard(label: 'Kelas aktif', value: '${stats['active_classes'] ?? 0}', icon: Icons.class_outlined, color: Colors.orange),
          ]),
          const SectionTitle('Keuangan bulan ini'),
          StatGrid([
            StatCard(label: 'Pemasukan', value: rupiah(fin['income']), icon: Icons.trending_up, color: Colors.green),
            StatCard(label: 'Saldo bersih', value: rupiah(fin['net']), icon: Icons.account_balance_outlined),
            StatCard(label: 'Piutang', value: rupiah(receivables['total']), icon: Icons.receipt_long_outlined, color: Colors.orange),
            StatCard(
                label: 'Lewat jatuh tempo',
                value: rupiah(receivables['overdue_total']),
                icon: Icons.warning_amber_outlined,
                color: Colors.red),
          ]),
          const SectionTitle('Perlu tindakan'),
          if (inbox.isEmpty) const EmptyState('Tidak ada pekerjaan tertunda.', icon: Icons.task_alt),
          for (final i in inbox)
            Card(
              child: ListTile(
                leading: const Icon(Icons.notifications_active_outlined, color: Colors.orange),
                title: Text(text(i['label'])),
                trailing: CircleAvatar(radius: 14, child: Text('${i['count']}', style: const TextStyle(fontSize: 12))),
              ),
            ),
          SectionTitle('Sesi hari ini (${today.length})'),
          if (today.isEmpty) const EmptyState('Tidak ada sesi hari ini.', icon: Icons.event_busy),
          for (final s in today)
            SessionCard(
              s,
              showDate: false,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => _SessionAttendanceScreen(s['id']))),
              footer: Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(
                    s['checked_in'] == true ? 'Tentor sudah absen masuk ${text(s['checkin_time'], '')}' : 'Tentor belum absen masuk',
                    style: TextStyle(fontSize: 12, color: s['checked_in'] == true ? Colors.green : Colors.orange),
                  ),
                  // Keterangan GPS / jam (di luar lokasi, di luar jam, terlambat)
                  if ((s['remarks'] as List? ?? []).isNotEmpty)
                    Text((s['remarks'] as List).join(' • '), style: TextStyle(fontSize: 12, color: Colors.orange.shade800)),
                ]),
              ),
            ),
        ]);
      },
    );
  }
}

/// Absensi siswa satu sesi (hanya lihat; pengisian oleh tentor atau lewat web).
class _SessionAttendanceScreen extends StatelessWidget {
  final String sessionId;
  const _SessionAttendanceScreen(this.sessionId);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Absensi Sesi')),
      body: AsyncView<Map>(
        load: () async => await api.get('/admin/attendances/sessions/$sessionId/students'),
        builder: (context, res, reload) {
          final s = res['session'] ?? {};
          final students = res['students'] as List? ?? [];
          return ListView(padding: const EdgeInsets.all(12), children: [
            SessionCard(s),
            SectionTitle('Siswa (${students.length})'),
            if (students.isEmpty) const EmptyState('Belum ada siswa di kelas ini.'),
            for (final st in students)
              Card(
                child: ListTile(
                  title: Text(text(st['full_name'])),
                  subtitle: Text([text(st['nis']), if (text(st['note'], '') != '') st['note']].join(' • ')),
                  trailing: StatusChip(st['attendance_status']),
                ),
              ),
          ]);
        },
      ),
    );
  }
}
