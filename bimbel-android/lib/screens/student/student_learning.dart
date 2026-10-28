import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';
import '../../widgets/file_opener.dart';
import 'student_exams.dart';

const _materialIcons = {
  'PDF': Icons.picture_as_pdf_outlined,
  'VIDEO': Icons.play_circle_outline,
  'LINK': Icons.link,
  'DOCUMENT': Icons.description_outlined,
};

class MaterialTile extends StatelessWidget {
  final Map material;
  const MaterialTile(this.material, {super.key});

  Future<void> _open(BuildContext context) async {
    final m = material;
    if (m['video_url'] != null) return openUrl(context, m['video_url']);
    if (m['external_url'] != null) return openUrl(context, m['external_url']);
    if (m['file_path'] != null) return openPrivateFile(context, '/materials/${m['id']}/file', text(m['title'], 'materi'));
    showSnack(context, 'Materi ini tidak memiliki berkas atau tautan.');
  }

  @override
  Widget build(BuildContext context) {
    final m = material;
    final sub = [
      if (m['subject_name'] != null && m['curriculum_title'] != null) '${m['subject_name']} • ${m['curriculum_title']}',
      if (m['covered_at'] != null) 'Dibahas ${tanggal(m['covered_at'], withDay: false)}',
      if (m['duration_minutes'] != null) '${m['duration_minutes']} menit',
    ].join('\n');
    return ListTile(
      leading: Icon(_materialIcons[m['material_type']] ?? Icons.menu_book_outlined),
      title: Text(text(m['title'])),
      subtitle: sub.isEmpty ? null : Text(sub),
      trailing: const Icon(Icons.open_in_new, size: 18),
      onTap: () => _open(context),
    );
  }
}

/*
|--------------------------------------------------------------------------
| MATERI
|--------------------------------------------------------------------------
*/

class StudentMaterialsTab extends StatefulWidget {
  const StudentMaterialsTab({super.key});

  @override
  State<StudentMaterialsTab> createState() => _StudentMaterialsTabState();
}

class _StudentMaterialsTabState extends State<StudentMaterialsTab> {
  final _key = GlobalKey<AsyncViewState>();
  String _keyword = '';

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
        child: TextField(
          decoration: const InputDecoration(hintText: 'Cari materi...', prefixIcon: Icon(Icons.search), isDense: true),
          textInputAction: TextInputAction.search,
          onSubmitted: (v) {
            _keyword = v;
            _key.currentState?.reload();
          },
        ),
      ),
      Expanded(
        child: AsyncView<Map>(
          key: _key,
          load: () async => (await api.get('/student/materials', query: {'keyword': _keyword}))['data'],
          builder: (context, data, _) {
            final subjects = data['subjects'] as List? ?? [];
            if (subjects.isEmpty) {
              return ListView(children: const [EmptyState('Belum ada materi.', icon: Icons.menu_book_outlined)]);
            }
            return ListView(
              padding: const EdgeInsets.all(8),
              children: [
                for (final s in subjects)
                  Card(
                    child: ExpansionTile(
                      title: Text(text(s['subject_name']), style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text('${s['covered_count']}/${s['material_count']} materi sudah dibahas'),
                      children: [
                        for (final c in s['chapters'] as List) ...[
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                            child: Text(text(c['title']), style: const TextStyle(fontWeight: FontWeight.w600)),
                          ),
                          for (final m in c['materials'] as List) MaterialTile(m),
                        ],
                      ],
                    ),
                  ),
              ],
            );
          },
        ),
      ),
    ]);
  }
}

/*
|--------------------------------------------------------------------------
| DETAIL SESI
|--------------------------------------------------------------------------
*/

const _activityLabels = {'MATERIAL': 'Materi', 'DISCUSSION': 'Diskusi', 'EXAM': 'Ujian', 'REVIEW': 'Review'};

class StudentSessionDetailScreen extends StatelessWidget {
  final String sessionId;
  const StudentSessionDetailScreen(this.sessionId, {super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detail Sesi')),
      body: AsyncView<Map>(
        load: () async => (await api.get('/student/sessions/$sessionId'))['data'],
        builder: (context, s, reload) {
          final activities = s['activities'] as List? ?? [];
          return ListView(padding: const EdgeInsets.all(12), children: [
            SessionCard(s),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(children: [
                  InfoRow('Pertemuan ke', text(s['meeting_no'])),
                  Row(children: [
                    const SizedBox(width: 130, child: Text('Kehadiran', style: TextStyle(color: Colors.grey))),
                    s['attendance_status'] == null ? const Text('Belum dicatat') : StatusChip(s['attendance_status']),
                  ]),
                ]),
              ),
            ),
            const SectionTitle('Aktivitas'),
            if (activities.isEmpty) const EmptyState('Belum ada aktivitas untuk sesi ini.'),
            for (final a in activities)
              Card(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    ListTile(
                      title: Text(text(a['title'])),
                      subtitle: Text([
                        _activityLabels[a['type']] ?? text(a['type']),
                        if (a['start_time'] != null) '${a['start_time']} - ${text(a['end_time'])}',
                        if (a['description'] != null) a['description'],
                      ].join(' • ')),
                      trailing: StatusChip(a['status']),
                    ),
                    if (a['material'] != null) MaterialTile(a['material']),
                    if (a['exam'] != null) _ExamAction(exam: a['exam'], activity: a, onChanged: reload),
                  ]),
                ),
              ),
          ]);
        },
      ),
    );
  }
}

class _ExamAction extends StatelessWidget {
  final Map exam;
  final Map activity;
  final VoidCallback onChanged;
  const _ExamAction({required this.exam, required this.activity, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final status = exam['result_status'];
    final canWork = activity['status'] == 'IN_PROGRESS' && (status == null || status == 'IN_PROGRESS');
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(children: [
        Expanded(
          child: Text(
            exam['score'] != null
                ? 'Nilai: ${exam['score']} / ${exam['total_score']}'
                : status == 'SUBMITTED'
                    ? 'Menunggu penilaian tentor'
                    : 'Durasi ${exam['duration']} menit',
          ),
        ),
        if (canWork)
          FilledButton(
            onPressed: () async {
              await startExam(context, examId: exam['id'], sessionActivityId: activity['id']);
              onChanged();
            },
            child: Text(status == 'IN_PROGRESS' ? 'Lanjutkan' : 'Kerjakan'),
          )
        else if (exam['result_id'] != null && status != 'IN_PROGRESS')
          TextButton(
            onPressed: () => Navigator.push(
                context, MaterialPageRoute(builder: (_) => StudentExamResultScreen(exam['result_id']))),
            child: const Text('Lihat hasil'),
          ),
      ]),
    );
  }
}
