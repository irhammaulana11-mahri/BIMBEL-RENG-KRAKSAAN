import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';

/// Catatan perkembangan siswa per kelas-mapel yang diajar (bahan rapor bulanan), sama dengan versi web.
class TentorProgressScreen extends StatefulWidget {
  const TentorProgressScreen({super.key});

  @override
  State<TentorProgressScreen> createState() => _TentorProgressScreenState();
}

class _TentorProgressScreenState extends State<TentorProgressScreen> {
  DateTime _month = DateTime(DateTime.now().year, DateTime.now().month);
  final _key = GlobalKey<AsyncViewState>();
  // Draft per "class_id|subject_id" -> student_id -> controller
  final _drafts = <String, Map<String, TextEditingController>>{};
  String? _saving;

  String get _period => DateFormat('yyyy-MM').format(_month);

  @override
  void dispose() {
    for (final g in _drafts.values) {
      for (final c in g.values) {
        c.dispose();
      }
    }
    super.dispose();
  }

  void _shiftMonth(int delta) {
    setState(() {
      _month = DateTime(_month.year, _month.month + delta);
      _drafts.clear();
    });
    // Muat ulang setelah rebuild agar AsyncView memakai periode baru
    WidgetsBinding.instance.addPostFrameCallback((_) => _key.currentState?.reload());
  }

  TextEditingController _controller(String group, Map s) => _drafts
      .putIfAbsent(group, () => {})
      .putIfAbsent('${s['student_id']}', () => TextEditingController(text: text(s['note'], '')));

  List<Map> _changed(String group, List students) => [
        for (final s in students)
          if (s['locked'] != true && _controller(group, s).text.trim() != text(s['note'], '').trim()) s,
      ];

  Future<void> _save(String group, Map g) async {
    final changed = _changed(group, g['students'] as List? ?? []);
    if (changed.isEmpty) return;
    setState(() => _saving = group);
    try {
      final res = await api.put('/tentor/progress-notes', {
        'period': _period,
        'class_id': g['class_id'],
        'subject_id': g['subject_id'],
        'notes': [
          for (final s in changed) {'student_id': s['student_id'], 'note': _controller(group, s).text.trim()},
        ],
      });
      if (!mounted) return;
      showSnack(context, text(res['message'], 'Catatan disimpan.'));
      _drafts.remove(group);
      await _key.currentState?.reload();
    } catch (e) {
      if (mounted) showSnack(context, '$e', error: true);
    } finally {
      if (mounted) setState(() => _saving = null);
    }
  }

  String _score(dynamic v) => v == null ? '-' : (v is num ? v.toStringAsFixed(1) : '$v');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Perkembangan Nilai')),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
          child: Row(children: [
            IconButton(onPressed: () => _shiftMonth(-1), icon: const Icon(Icons.chevron_left)),
            Expanded(
              child: Text(DateFormat('MMMM yyyy', 'id_ID').format(_month),
                  textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w600)),
            ),
            IconButton(onPressed: () => _shiftMonth(1), icon: const Icon(Icons.chevron_right)),
          ]),
        ),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: Text('Catatan masuk ke rapor bulanan yang diterbitkan Admin.', style: TextStyle(fontSize: 12, color: Colors.grey)),
        ),
        Expanded(
          child: AsyncView<List>(
            key: _key,
            load: () async => (await api.get('/tentor/progress-notes', query: {'period': _period}))['data'],
            builder: (context, groups, _) => ListView(padding: const EdgeInsets.all(12), children: [
              if (groups.isEmpty) const EmptyState('Tidak ada kelas atau mapel yang Anda ajar pada periode ini.'),
              for (final g in groups) _groupCard(g),
            ]),
          ),
        ),
      ]),
    );
  }

  Widget _groupCard(Map g) {
    final group = '${g['class_id']}|${g['subject_id']}';
    final students = g['students'] as List? ?? [];
    final filled = g['notes_filled'] ?? 0;
    final complete = students.isNotEmpty && filled >= students.length;
    final changed = _changed(group, students).length;

    return Card(
      child: ExpansionTile(
        initiallyExpanded: true,
        leading: const Icon(Icons.menu_book_outlined),
        title: Text(text(g['subject_name']), style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text('${text(g['class_name'])} • ${students.length} siswa'),
        trailing: Text('$filled/${students.length}',
            style: TextStyle(fontWeight: FontWeight.bold, color: complete ? Colors.green : Colors.orange)),
        childrenPadding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
        children: [
          if (students.isEmpty) const Text('Belum ada siswa di kelas ini.', style: TextStyle(color: Colors.grey)),
          for (final s in students)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Expanded(child: Text(text(s['student_name']), style: const TextStyle(fontWeight: FontWeight.w600))),
                  if (s['locked'] == true) const Chip(label: Text('Rapor terbit'), avatar: Icon(Icons.lock, size: 14)),
                ]),
                Text('Hadir ${s['hadir'] ?? 0}/${s['held_sessions'] ?? 0} • Nilai ${_score(s['exam_average'])} (${s['exam_count'] ?? 0} ujian)',
                    style: const TextStyle(fontSize: 12, color: Colors.grey)),
                TextField(
                  controller: _controller(group, s),
                  enabled: s['locked'] != true,
                  maxLines: 3,
                  minLines: 2,
                  maxLength: 2000,
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(hintText: 'Contoh: Sudah paham konsep pecahan, perlu latihan soal cerita.'),
                ),
                if (s['note_by'] != null) Text('Ditulis oleh ${s['note_by']}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
              ]),
            ),
          if (students.isNotEmpty)
            FilledButton.icon(
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(44)),
              onPressed: changed == 0 || _saving == group ? null : () => _save(group, g),
              icon: const Icon(Icons.save),
              label: Text(_saving == group ? 'Menyimpan...' : changed > 0 ? 'Simpan $changed catatan' : 'Tersimpan'),
            ),
        ],
      ),
    );
  }
}
