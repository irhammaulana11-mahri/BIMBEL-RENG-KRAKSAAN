import 'package:flutter/material.dart';

import '../api/api_client.dart';
import '../widgets/common.dart';

/// Daftar rapor bulanan yang sudah diterbitkan (portal siswa & orang tua).
class ReportsScreen extends StatelessWidget {
  final String basePath;
  const ReportsScreen({super.key, required this.basePath});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Rapor Perkembangan')),
      body: AsyncView<List>(
        load: () async => (await api.get(basePath))['data'],
        builder: (context, reports, _) => ListView(padding: const EdgeInsets.all(12), children: [
          if (reports.isEmpty) const EmptyState('Belum ada rapor yang diterbitkan.', icon: Icons.description_outlined),
          for (final r in reports)
            Card(
              child: ListTile(
                title: Text('${label(r['period'])} • ${label(r['class'])}'),
                subtitle: Text('${label(r['student'])}\n'
                    'Kehadiran ${r['attendance_percentage'] ?? 0}% • Rata-rata ujian ${text(r['exam_average'])}'),
                isThreeLine: true,
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.push(
                    context, MaterialPageRoute(builder: (_) => _ReportDetailScreen('$basePath/${r['report_id']}'))),
              ),
            ),
        ]),
      ),
    );
  }
}

class _ReportDetailScreen extends StatelessWidget {
  final String path;
  const _ReportDetailScreen(this.path);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detail Rapor')),
      body: AsyncView<Map>(
        load: () async => (await api.get(path))['data'],
        builder: (context, r, _) {
          final att = r['attendance'] ?? {};
          final exam = r['exam'] ?? {};
          final subjects = r['subjects'] as List? ?? [];
          final general = r['general_note'] is Map ? r['general_note']['note'] : r['general_note'];
          return ListView(padding: const EdgeInsets.all(12), children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(children: [
                  InfoRow('Siswa', label(r['student'])),
                  InfoRow('Kelas', label(r['class'])),
                  InfoRow('Periode', label(r['period'])),
                  InfoRow('Diterbitkan', text(r['published_at'])),
                ]),
              ),
            ),
            StatGrid([
              StatCard(
                  label: 'Kehadiran (${att['hadir'] ?? 0}/${att['held_sessions'] ?? 0})',
                  value: '${att['percentage'] ?? 0}%',
                  icon: Icons.fact_check_outlined,
                  color: Colors.green),
              StatCard(
                  label: '${exam['count'] ?? 0} ujian',
                  value: text(exam['average']),
                  icon: Icons.insights_outlined,
                  color: Colors.orange),
            ]),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Text('Izin ${att['izin'] ?? 0} • Sakit ${att['sakit'] ?? 0} • Alpa ${att['alpa'] ?? 0}'),
              ),
            ),
            if (general != null && '$general'.isNotEmpty) ...[
              const SectionTitle('Catatan umum'),
              Card(child: Padding(padding: const EdgeInsets.all(14), child: Text('$general'))),
            ],
            const SectionTitle('Per mata pelajaran'),
            if (subjects.isEmpty) const EmptyState('Tidak ada data mata pelajaran.'),
            for (final s in subjects)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(text(s['subject_name']), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    Text(text(s['tentor_name']), style: const TextStyle(color: Colors.grey)),
                    const SizedBox(height: 6),
                    InfoRow('Kehadiran', '${s['hadir']}/${s['held_sessions']} (${s['attendance_percentage'] ?? 0}%)'),
                    InfoRow('Rata-rata ujian', '${text(s['exam_average'])} (${s['exam_count']} ujian)'),
                    if (s['note'] != null) InfoRow('Catatan tentor', text(s['note'])),
                  ]),
                ),
              ),
          ]);
        },
      ),
    );
  }
}
