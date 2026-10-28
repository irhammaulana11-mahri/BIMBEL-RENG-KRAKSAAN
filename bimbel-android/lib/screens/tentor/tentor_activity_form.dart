import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';

const _types = [
  ('MATERIAL', 'Materi', 'Pilih kurikulum & topik', Icons.menu_book_outlined, Colors.blue),
  ('EXAM', 'Ujian', 'Pilih ujian yang tersedia', Icons.assignment_outlined, Colors.red),
  ('DISCUSSION', 'Diskusi', 'Interaksi pembelajaran', Icons.forum_outlined, Colors.purple),
  ('REVIEW', 'Review', 'Pembahasan materi', Icons.replay, Colors.orange),
];

/// Tambah aktivitas sesi (sama dengan versi web): pilih jenis -> pilih materi/ujian -> isi detail.
/// Mengembalikan true bila aktivitas tersimpan.
class TentorActivityForm extends StatefulWidget {
  final Map session;
  const TentorActivityForm(this.session, {super.key});

  @override
  State<TentorActivityForm> createState() => _TentorActivityFormState();
}

class _TentorActivityFormState extends State<TentorActivityForm> {
  String? _type;
  String? _curriculumId;
  Map? _reference; // materi atau ujian terpilih
  String? _reviewMaterialId;
  final _title = TextEditingController();
  final _description = TextEditingController();
  late String _start = text(widget.session['start_time'], '');
  late String _end = text(widget.session['end_time'], '');
  bool _saving = false;

  String get _base => '/tentor/sessions/${widget.session['id']}';

  // Jenis yang butuh referensi harus memilihnya dulu sebelum mengisi detail
  bool get _needsReference => _type == 'MATERIAL' || _type == 'EXAM';

  Future<void> _pickTime(bool isStart) async {
    final current = isStart ? _start : _end;
    final parts = current.split(':');
    final initial = parts.length >= 2
        ? TimeOfDay(hour: int.tryParse(parts[0]) ?? 8, minute: int.tryParse(parts[1]) ?? 0)
        : TimeOfDay.now();
    final t = await showTimePicker(context: context, initialTime: initial);
    if (t == null) return;
    final value = '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
    setState(() => isStart ? _start = value : _end = value);
  }

  Future<void> _save() async {
    if (_title.text.trim().isEmpty) return showSnack(context, 'Judul aktivitas wajib diisi.', error: true);
    if (_type == 'DISCUSSION' && _description.text.trim().isEmpty) {
      return showSnack(context, 'Pertanyaan / topik diskusi wajib diisi.', error: true);
    }
    if (_start.isEmpty || _end.isEmpty) return showSnack(context, 'Jam mulai dan selesai wajib diisi.', error: true);

    final referenceId = _needsReference ? _reference!['id'] : (_type == 'REVIEW' ? _reviewMaterialId : null);
    setState(() => _saving = true);
    try {
      await api.post('$_base/activities', {
        'type': _type,
        'title': _title.text.trim(),
        'description': _description.text.trim().isEmpty ? null : _description.text.trim(),
        'start_time': _start,
        'end_time': _end,
        'activityable_id': referenceId,
      });
      if (!mounted) return;
      showSnack(context, 'Aktivitas berhasil ditambahkan.');
      Navigator.pop(context, true);
    } catch (e) {
      if (mounted) showSnack(context, '$e', error: true);
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_type == null ? 'Tambah Aktivitas' : 'Aktivitas ${_types.firstWhere((t) => t.$1 == _type).$2}'),
        leading: _type == null
            ? null
            : IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => setState(() {
                  // Mundur satu langkah: detail -> pilih referensi -> pilih jenis
                  if (_needsReference && _reference != null) {
                    _reference = null;
                  } else {
                    _type = null;
                  }
                }),
              ),
      ),
      body: _type == null
          ? _typePicker()
          : AsyncView<Map>(
              load: () async => (await api.get('$_base/reference-data'))['data'],
              builder: (context, ref, _) => _needsReference && _reference == null ? _referencePicker(ref) : _detailForm(ref),
            ),
    );
  }

  Widget _typePicker() => ListView(padding: const EdgeInsets.all(12), children: [
        Text('${text(widget.session['subject_name'])} • ${text(widget.session['class_name'])}',
            style: const TextStyle(color: Colors.grey)),
        const SizedBox(height: 8),
        for (final t in _types)
          Card(
            child: ListTile(
              leading: Icon(t.$4, color: t.$5),
              title: Text(t.$2, style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: Text(t.$3),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => setState(() {
                _type = t.$1;
                _reference = null;
                _reviewMaterialId = null;
                _title.clear();
                _description.clear();
              }),
            ),
          ),
      ]);

  Widget _referencePicker(Map ref) {
    if (_type == 'EXAM') {
      final exams = ref['exams'] as List? ?? [];
      return ListView(padding: const EdgeInsets.all(12), children: [
        if (exams.isEmpty) const EmptyState('Belum ada ujian terbit untuk mapel ini.'),
        for (final ex in exams)
          Card(
            child: ListTile(
              leading: const Icon(Icons.assignment_outlined, color: Colors.red),
              title: Text(text(ex['title'])),
              subtitle: Text('${ex['total_questions'] ?? 0} soal • ${ex['duration'] ?? '-'} menit'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => setState(() {
                _reference = ex;
                _title.text = text(ex['title'], '');
              }),
            ),
          ),
      ]);
    }

    final curriculums = ref['curriculums'] as List? ?? [];
    if (curriculums.isEmpty) return const EmptyState('Belum ada kurikulum aktif untuk mapel ini.');
    final selectedId = _curriculumId ?? '${curriculums.first['id']}';
    final curriculum = curriculums.firstWhere((c) => '${c['id']}' == selectedId, orElse: () => curriculums.first);
    final materials = curriculum['materials'] as List? ?? [];

    return ListView(padding: const EdgeInsets.all(12), children: [
      DropdownButtonFormField<String>(
        initialValue: selectedId,
        isExpanded: true,
        decoration: const InputDecoration(labelText: 'Kurikulum / Bab'),
        items: [for (final c in curriculums) DropdownMenuItem(value: '${c['id']}', child: Text(text(c['title']), overflow: TextOverflow.ellipsis))],
        onChanged: (v) => setState(() => _curriculumId = v),
      ),
      const SizedBox(height: 8),
      if (materials.isEmpty) const EmptyState('Belum ada topik materi di kurikulum ini.'),
      for (final m in materials)
        Card(
          child: ListTile(
            leading: const Icon(Icons.menu_book_outlined, color: Colors.blue),
            title: Text(text(m['title'])),
            subtitle: m['description'] != null ? Text(text(m['description']), maxLines: 2, overflow: TextOverflow.ellipsis) : null,
            trailing: const Icon(Icons.chevron_right),
            onTap: () => setState(() {
              _reference = m;
              _title.text = text(m['title'], '');
            }),
          ),
        ),
    ]);
  }

  Widget _detailForm(Map ref) {
    final allMaterials = [for (final c in ref['curriculums'] as List? ?? []) ...(c['materials'] as List? ?? [])];
    return ListView(padding: const EdgeInsets.all(16), children: [
      if (_reference != null)
        Card(
          child: ListTile(
            leading: Icon(_type == 'EXAM' ? Icons.assignment_outlined : Icons.menu_book_outlined),
            title: Text(text(_reference!['title'])),
            subtitle: Text(_type == 'EXAM' ? 'Ujian terpilih' : 'Materi terpilih'),
          ),
        ),
      TextField(controller: _title, decoration: const InputDecoration(labelText: 'Judul aktivitas')),
      if (_type == 'REVIEW')
        DropdownButtonFormField<String>(
          initialValue: _reviewMaterialId,
          isExpanded: true,
          decoration: const InputDecoration(labelText: 'Materi yang direview (opsional)'),
          items: [
            const DropdownMenuItem<String>(value: null, child: Text('- Tanpa materi -')),
            for (final m in allMaterials) DropdownMenuItem(value: '${m['id']}', child: Text(text(m['title']), overflow: TextOverflow.ellipsis)),
          ],
          onChanged: (v) => setState(() => _reviewMaterialId = v),
        ),
      if (_type != 'EXAM')
        TextField(
          controller: _description,
          maxLines: 3,
          decoration: InputDecoration(labelText: _type == 'DISCUSSION' ? 'Pertanyaan / topik diskusi' : 'Keterangan (opsional)'),
        ),
      const SizedBox(height: 12),
      Row(children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: () => _pickTime(true),
            icon: const Icon(Icons.schedule, size: 18),
            label: Text('Mulai ${_start.isEmpty ? '--:--' : _start}'),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: OutlinedButton.icon(
            onPressed: () => _pickTime(false),
            icon: const Icon(Icons.schedule, size: 18),
            label: Text('Selesai ${_end.isEmpty ? '--:--' : _end}'),
          ),
        ),
      ]),
      const SizedBox(height: 20),
      FilledButton.icon(
        style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
        onPressed: _saving ? null : _save,
        icon: const Icon(Icons.save),
        label: Text(_saving ? 'Menyimpan...' : 'Simpan aktivitas'),
      ),
    ]);
  }
}
