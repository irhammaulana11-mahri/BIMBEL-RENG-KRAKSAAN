import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';

const _statuses = ['HADIR', 'IZIN', 'SAKIT', 'ALPA'];

/// Tentor mengajukan koreksi absensi siswa pada sesi yang sudah selesai (disetujui admin).
/// Mengembalikan true bila pengajuan terkirim.
Future<bool> showCorrectionDialog(BuildContext context, String sessionBase, Map student) async {
  final sent = await showDialog<bool>(
    context: context,
    builder: (_) => _CorrectionDialog(sessionBase, student),
  );
  return sent == true;
}

class _CorrectionDialog extends StatefulWidget {
  final String sessionBase;
  final Map student;
  const _CorrectionDialog(this.sessionBase, this.student);

  @override
  State<_CorrectionDialog> createState() => _CorrectionDialogState();
}

class _CorrectionDialogState extends State<_CorrectionDialog> {
  final _reason = TextEditingController();
  String? _status;
  bool _sending = false;

  String get _current => text(widget.student['attendance_status'], 'BELUM');

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_status == null) return showSnack(context, 'Pilih status yang benar.', error: true);
    if (_reason.text.trim().length < 10) return showSnack(context, 'Alasan minimal 10 karakter.', error: true);
    setState(() => _sending = true);
    try {
      final res = await api.post('${widget.sessionBase}/attendance-corrections', {
        'student_id': widget.student['student_id'],
        'new_status': _status,
        'reason': _reason.text.trim(),
      });
      if (!mounted) return;
      showSnack(context, text(res['message'], 'Pengajuan koreksi terkirim.'));
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _sending = false);
      showSnack(context, '$e', error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Ajukan koreksi absensi'),
      content: SingleChildScrollView(
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(text(widget.student['full_name']), style: const TextStyle(fontWeight: FontWeight.w600)),
          Text('Status saat ini: $_current', style: const TextStyle(color: Colors.grey, fontSize: 12)),
          const SizedBox(height: 10),
          const Text('Status yang benar'),
          Wrap(spacing: 6, children: [
            for (final s in _statuses.where((s) => s != _current))
              ChoiceChip(
                label: Text(s[0] + s.substring(1).toLowerCase()),
                selected: _status == s,
                onSelected: (_) => setState(() => _status = s),
              ),
          ]),
          const SizedBox(height: 10),
          TextField(
            controller: _reason,
            maxLines: 3,
            maxLength: 1000,
            decoration: const InputDecoration(labelText: 'Alasan (minimal 10 karakter)', border: OutlineInputBorder()),
          ),
          const Text('Pengajuan ditinjau admin. Absensi berubah setelah disetujui.', style: TextStyle(fontSize: 12, color: Colors.grey)),
        ]),
      ),
      actions: [
        TextButton(onPressed: _sending ? null : () => Navigator.pop(context, false), child: const Text('Batal')),
        FilledButton(onPressed: _sending ? null : _submit, child: Text(_sending ? 'Mengirim...' : 'Kirim')),
      ],
    );
  }
}

/// Riwayat pengajuan koreksi tentor untuk satu sesi beserta keputusan admin.
class CorrectionHistory extends StatelessWidget {
  final String sessionId;
  const CorrectionHistory(this.sessionId, {super.key});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: api.get('/tentor/attendance-corrections', query: {'session_id': sessionId}),
      builder: (context, snap) {
        final rows = (snap.data is Map ? snap.data['data'] : null) as List? ?? [];
        if (rows.isEmpty) return const SizedBox.shrink();
        return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const SectionTitle('Pengajuan koreksi Anda'),
          for (final r in rows)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Expanded(
                      child: Text('${text(r['student_name'])}: ${text(r['old_status'])} → ${text(r['new_status'])}',
                          style: const TextStyle(fontWeight: FontWeight.w600)),
                    ),
                    StatusChip(r['status']),
                  ]),
                  const SizedBox(height: 4),
                  Text('Alasan: ${text(r['reason'])}', style: const TextStyle(fontSize: 12)),
                  if (r['review_note'] != null) Text('Catatan admin: ${text(r['review_note'])}', style: const TextStyle(fontSize: 12)),
                ]),
              ),
            ),
        ]);
      },
    );
  }
}
