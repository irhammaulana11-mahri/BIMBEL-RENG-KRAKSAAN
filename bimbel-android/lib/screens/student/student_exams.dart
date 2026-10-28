import 'dart:async';

import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';

/// Mulai / lanjutkan ujian lalu buka lembar ujian.
Future<void> startExam(BuildContext context, {required String examId, String? sessionActivityId}) async {
  try {
    final res = await api.post('/student/exams/$examId/start', {'session_activity_id': sessionActivityId});
    if (!context.mounted) return;
    await Navigator.push(context, MaterialPageRoute(builder: (_) => ExamAttemptScreen(res['data']['result_id'])));
  } catch (e) {
    if (context.mounted) showSnack(context, '$e', error: true);
  }
}

/*
|--------------------------------------------------------------------------
| DAFTAR UJIAN
|--------------------------------------------------------------------------
*/

class StudentExamsTab extends StatefulWidget {
  const StudentExamsTab({super.key});

  @override
  State<StudentExamsTab> createState() => _StudentExamsTabState();
}

class _StudentExamsTabState extends State<StudentExamsTab> {
  final _key = GlobalKey<AsyncViewState>();

  @override
  Widget build(BuildContext context) {
    return AsyncView<Map>(
      key: _key,
      load: () async => (await api.get('/student/exams'))['data'],
      builder: (context, data, reload) {
        final available = data['available'] as List? ?? [];
        final upcoming = data['upcoming'] as List? ?? [];
        final history = data['history'] as List? ?? [];
        return ListView(padding: const EdgeInsets.all(12), children: [
          const SectionTitle('Bisa dikerjakan sekarang'),
          if (available.isEmpty) const EmptyState('Tidak ada ujian yang sedang dibuka.', icon: Icons.assignment_outlined),
          for (final e in available)
            Card(
              child: ListTile(
                title: Text(text(e['title'])),
                subtitle: Text([
                  text(e['subject_name']),
                  '${e['total_questions']} soal • ${e['duration']} menit',
                  if (e['class_name'] != null) e['class_name'],
                  if (e['closes_at'] != null) 'Ditutup ${e['closes_at']}',
                ].join('\n')),
                isThreeLine: true,
                trailing: FilledButton(
                  onPressed: () async {
                    await startExam(context, examId: e['exam_id'], sessionActivityId: e['session_activity_id']);
                    reload();
                  },
                  child: Text(e['result_id'] != null ? 'Lanjut' : 'Mulai'),
                ),
              ),
            ),
          if (upcoming.isNotEmpty) ...[
            const SectionTitle('Akan datang'),
            for (final e in upcoming)
              Card(
                child: ListTile(
                  leading: const Icon(Icons.schedule),
                  title: Text(text(e['title'])),
                  subtitle: Text('${text(e['subject_name'])}\nDibuka ${text(e['opens_at']).replaceAll('T', ' ')}'),
                  isThreeLine: true,
                ),
              ),
          ],
          const SectionTitle('Riwayat'),
          if (history.isEmpty) const EmptyState('Belum ada ujian yang dikumpulkan.'),
          for (final r in history)
            Card(
              child: ListTile(
                title: Text(text(r['exam_title'])),
                subtitle: Text('${text(r['subject_name'])} • ${text(r['submitted_at'])}'),
                trailing: r['score'] != null
                    ? Text('${r['score']}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold))
                    : StatusChip(r['status']),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => StudentExamResultScreen(r['id']))),
              ),
            ),
        ]);
      },
    );
  }
}

/*
|--------------------------------------------------------------------------
| MENGERJAKAN UJIAN
|--------------------------------------------------------------------------
*/

class ExamAttemptScreen extends StatefulWidget {
  final String resultId;
  const ExamAttemptScreen(this.resultId, {super.key});

  @override
  State<ExamAttemptScreen> createState() => _ExamAttemptScreenState();
}

class _ExamAttemptScreenState extends State<ExamAttemptScreen> {
  Map? _data;
  String? _error;
  final _answers = <String, String?>{};
  final _debounce = <String, Timer>{};
  final _saving = <String>{};
  Timer? _ticker;
  int _remaining = 0;
  bool _submitting = false;

  String get _base => '/student/exam-results/${widget.resultId}';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _ticker?.cancel();
    for (final t in _debounce.values) {
      t.cancel();
    }
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final data = (await api.get(_base))['data'] as Map;
      if (!mounted) return;
      if (data['mode_view'] != 'ATTEMPT') {
        // Sudah dikumpulkan / waktu habis: tampilkan hasil
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => StudentExamResultScreen(widget.resultId)));
        return;
      }
      final saved = data['answers'];
      if (saved is Map) saved.forEach((k, v) => _answers['$k'] = v?.toString());
      setState(() {
        _data = data;
        _remaining = data['remaining_seconds'] ?? 0;
      });
      _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
        if (_remaining <= 1) {
          _ticker?.cancel();
          _submit(auto: true);
        }
        if (mounted) setState(() => _remaining = (_remaining - 1).clamp(0, 1 << 30));
      });
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    }
  }

  void _setAnswer(String questionId, String? value, {bool debounce = false}) {
    setState(() => _answers[questionId] = value);
    _debounce[questionId]?.cancel();
    if (debounce) {
      _debounce[questionId] = Timer(const Duration(milliseconds: 800), () => _save(questionId));
    } else {
      _save(questionId);
    }
  }

  Future<void> _save(String questionId) async {
    _debounce.remove(questionId);
    setState(() => _saving.add(questionId));
    try {
      await api.put('$_base/answers', {'question_id': questionId, 'answer': _answers[questionId]});
    } catch (e) {
      if (mounted) showSnack(context, 'Gagal menyimpan jawaban: $e', error: true);
    } finally {
      if (mounted) setState(() => _saving.remove(questionId));
    }
  }

  Future<void> _submit({bool auto = false}) async {
    if (_submitting) return;
    if (!auto) {
      final questions = _data!['questions'] as List;
      final empty = questions.where((q) => (_answers[q['id']] ?? '').isEmpty).length;
      final ok = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Kumpulkan ujian?'),
          content: Text(empty > 0
              ? 'Masih ada $empty soal yang belum dijawab. Jawaban tidak bisa diubah setelah dikumpulkan.'
              : 'Jawaban tidak bisa diubah setelah dikumpulkan.'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Kumpulkan')),
          ],
        ),
      );
      if (ok != true) return;
    }
    setState(() => _submitting = true);
    _ticker?.cancel();
    try {
      // Simpan jawaban isian yang belum terkirim
      for (final id in _debounce.keys.toList()) {
        _debounce[id]?.cancel();
        await _save(id);
      }
      final res = await api.post('$_base/submit');
      if (!mounted) return;
      showSnack(context, text(res['message'], 'Ujian dikumpulkan.'));
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => StudentExamResultScreen(widget.resultId)));
    } catch (e) {
      if (mounted) {
        showSnack(context, '$e', error: true);
        setState(() => _submitting = false);
      }
    }
  }

  String get _clock {
    final m = _remaining ~/ 60, s = _remaining % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    if (_data == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Ujian')),
        body: Center(child: _error != null ? Text(_error!) : const CircularProgressIndicator()),
      );
    }
    final questions = _data!['questions'] as List;
    final answered = questions.where((q) => (_answers[q['id']] ?? '').isNotEmpty).length;
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final leave = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Tinggalkan ujian?'),
            content: const Text('Jawaban sudah tersimpan otomatis. Waktu tetap berjalan, dan ujian bisa dilanjutkan nanti.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Tetap di sini')),
              TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Keluar')),
            ],
          ),
        );
        if (leave == true && context.mounted) Navigator.pop(context);
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(text(_data!['exam_title']), overflow: TextOverflow.ellipsis),
          actions: [
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Center(
                child: Text(_clock,
                    style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: _remaining < 300 ? Colors.red : null,
                        fontFeatures: const [FontFeature.tabularFigures()])),
              ),
            ),
          ],
        ),
        body: ListView.builder(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 96),
          itemCount: questions.length,
          itemBuilder: (context, i) => _QuestionCard(
            number: i + 1,
            question: questions[i],
            answer: _answers[questions[i]['id']],
            saving: _saving.contains(questions[i]['id']),
            onChanged: (v, {debounce = false}) => _setAnswer(questions[i]['id'], v, debounce: debounce),
          ),
        ),
        bottomNavigationBar: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(children: [
              Expanded(child: Text('Terjawab $answered/${questions.length}')),
              FilledButton.icon(
                onPressed: _submitting ? null : () => _submit(),
                icon: const Icon(Icons.send),
                label: const Text('Kumpulkan'),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}

class _QuestionCard extends StatefulWidget {
  final int number;
  final Map question;
  final String? answer;
  final bool saving;
  final void Function(String? value, {bool debounce}) onChanged;
  const _QuestionCard(
      {required this.number, required this.question, required this.answer, required this.saving, required this.onChanged});

  @override
  State<_QuestionCard> createState() => _QuestionCardState();
}

class _QuestionCardState extends State<_QuestionCard> {
  late final _controller = TextEditingController(text: widget.answer ?? '');

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final q = widget.question;
    final type = q['question_type'];
    final options = q['options'] as List? ?? [];
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Text('Soal ${widget.number}', style: const TextStyle(fontWeight: FontWeight.bold)),
            const Spacer(),
            if (widget.saving) const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)),
            const SizedBox(width: 8),
            Text('${q['score']} poin', style: const TextStyle(color: Colors.grey, fontSize: 12)),
          ]),
          const SizedBox(height: 8),
          Text(text(q['question'])),
          const SizedBox(height: 8),
          if (type == 'MULTIPLE_CHOICE' || type == 'TRUE_FALSE')
            RadioGroup<String>(
              groupValue: widget.answer,
              onChanged: (v) => widget.onChanged(v),
              child: Column(children: [
                for (final o in options)
                  RadioListTile<String>(
                    value: '${o['key']}',
                    contentPadding: EdgeInsets.zero,
                    title: Text(type == 'MULTIPLE_CHOICE' ? '${o['key']}. ${o['text']}' : '${o['text']}'),
                  ),
              ]),
            )
          else
            TextField(
              controller: _controller,
              minLines: type == 'ESSAY' ? 4 : 1,
              maxLines: type == 'ESSAY' ? 10 : 1,
              decoration: InputDecoration(hintText: type == 'ESSAY' ? 'Tulis jawaban essay...' : 'Jawaban singkat'),
              onChanged: (v) => widget.onChanged(v, debounce: true),
            ),
        ]),
      ),
    );
  }
}

/*
|--------------------------------------------------------------------------
| HASIL UJIAN
|--------------------------------------------------------------------------
*/

class StudentExamResultScreen extends StatelessWidget {
  final String resultId;
  const StudentExamResultScreen(this.resultId, {super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Hasil Ujian')),
      body: AsyncView<Map>(
        load: () async => (await api.get('/student/exam-results/$resultId'))['data'],
        builder: (context, r, _) => ExamResultView(r),
      ),
    );
  }
}

/// Ringkasan + pembahasan hasil ujian (dipakai juga oleh tentor).
class ExamResultView extends StatelessWidget {
  final Map result;
  final Widget Function(Map answer)? answerFooter;
  final List<Widget> header;
  const ExamResultView(this.result, {super.key, this.answerFooter, this.header = const []});

  @override
  Widget build(BuildContext context) {
    final r = result;
    final answers = r['answers'] as List? ?? [];
    final showReview = r['show_review'] == true;
    return ListView(padding: const EdgeInsets.all(12), children: [
      Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(children: [
            Text(text(r['exam_title']), style: Theme.of(context).textTheme.titleLarge, textAlign: TextAlign.center),
            Text(text(r['subject_name'])),
            const SizedBox(height: 12),
            if (r['score'] != null)
              Text('${r['score']} / ${r['total_score']}',
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(fontWeight: FontWeight.bold))
            else
              const StatusChip('SUBMITTED'),
            if (r['total_correct'] != null)
              Text('Benar ${r['total_correct']} • Salah ${r['total_wrong']} • Kosong ${r['total_unanswered']}'),
            if (r['student_name'] != null) Text(text(r['student_name'])),
            Text('Dikumpulkan ${text(r['submitted_at'])}', style: const TextStyle(color: Colors.grey)),
            if (r['feedback'] != null && '${r['feedback']}'.isNotEmpty) ...[
              const Divider(),
              Text('Catatan tentor: ${r['feedback']}'),
            ],
          ]),
        ),
      ),
      ...header,
      if (!showReview)
        const EmptyState('Pembahasan tampil setelah tentor selesai menilai.', icon: Icons.hourglass_empty)
      else ...[
        const SectionTitle('Pembahasan'),
        for (final a in answers)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Text('Soal ${a['order_no']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                  const Spacer(),
                  if (a['is_correct'] == true) const Icon(Icons.check_circle, color: Colors.green, size: 20),
                  if (a['is_correct'] == false) const Icon(Icons.cancel, color: Colors.red, size: 20),
                  const SizedBox(width: 6),
                  Text('${a['score'] ?? 0}/${a['max_score']}'),
                ]),
                const SizedBox(height: 6),
                Text(text(a['question'])),
                const SizedBox(height: 8),
                InfoRow('Jawaban', _optionText(a, a['answer'])),
                if (a['correct_answer'] != null) InfoRow('Kunci', _optionText(a, a['correct_answer'])),
                if (a['essay_answer'] != null) InfoRow('Contoh jawaban', text(a['essay_answer'])),
                if (a['teacher_feedback'] != null) InfoRow('Catatan', text(a['teacher_feedback'])),
                if (answerFooter != null) answerFooter!(a),
              ]),
            ),
          ),
      ],
    ]);
  }

  static String _optionText(Map a, dynamic key) {
    if (key == null || '$key'.isEmpty) return '(kosong)';
    for (final o in a['options'] as List? ?? []) {
      if ('${o['key']}' == '$key') return a['question_type'] == 'MULTIPLE_CHOICE' ? '$key. ${o['text']}' : '${o['text']}';
    }
    return '$key';
  }
}
