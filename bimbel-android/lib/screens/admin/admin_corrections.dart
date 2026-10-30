import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../auth/auth_state.dart';
import '../../widgets/common.dart';
import 'admin_finance.dart' show askReason, runAction;

/// Koreksi absensi siswa yang diajukan tentor/admin. Persetujuan meminta password ulang;
/// dampak tagihan & honor ditampilkan sebelum diputuskan.
class AdminCorrectionCard extends StatefulWidget {
  final Map c;
  final VoidCallback onChanged;
  const AdminCorrectionCard(this.c, {super.key, required this.onChanged});

  @override
  State<AdminCorrectionCard> createState() => _AdminCorrectionCardState();
}

class _AdminCorrectionCardState extends State<AdminCorrectionCard> {
  bool _busy = false;

  Map? get _billing => widget.c['financial_effect']?['billing'];
  Map? get _payroll => widget.c['financial_effect']?['payroll'];

  Future<void> _reject() async {
    final reason = await askReason(context, 'Tolak koreksi');
    if (reason == null || !mounted) return;
    setState(() => _busy = true);
    final ok = await runAction(context, () => api.patch('/admin/attendances/corrections/${widget.c['id']}/reject', {'note': reason}), 'Koreksi ditolak.');
    if (!mounted) return;
    setState(() => _busy = false);
    if (ok) widget.onChanged();
  }

  Future<void> _approve() async {
    final done = await showDialog<bool>(context: context, builder: (_) => _ApproveDialog(widget.c));
    if (done == true && mounted) widget.onChanged();
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.c;
    final pending = c['status'] == 'PENDING';
    final billing = _billing;
    final payroll = _payroll;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(text(c['student_name']), style: const TextStyle(fontWeight: FontWeight.bold))),
            StatusChip(c['status']),
          ]),
          const SizedBox(height: 6),
          InfoRow('Sesi', '${tanggal(c['session_date'])} • ${text(c['subject_name'])} • ${text(c['class_name'])}'),
          InfoRow('Perubahan', '${text(c['old_status'])} → ${text(c['new_status'])}'),
          InfoRow('Alasan', text(c['reason'])),
          InfoRow('Diajukan', '${text(c['requested_by'])} • ${text(c['requested_at'])}'),
          if (billing != null && (billing['delta'] ?? 0) != 0)
            InfoRow('Tagihan ${text(billing['invoice_no'])}', (billing['delta'] ?? 0) > 0
                ? 'Kurang tagih ${rupiah(billing['delta'])} (tagihan penyesuaian)'
                : 'Lebih tagih ${rupiah((billing['delta'] as num).abs())} (belum dibayar ${rupiah(billing['unpaid_portion'])}, sudah dibayar ${rupiah(billing['paid_portion'])})'),
          if (payroll != null && (payroll['delta'] ?? 0) != 0)
            InfoRow('Honor ${text(payroll['tentor_name'])}', '${(payroll['delta'] as num) > 0 ? '+' : '-'}${rupiah((payroll['delta'] as num).abs())} (payroll ${text(payroll['payroll_no'])}, ${text(payroll['payroll_status'])})'),
          if (c['reviewed_by'] != null) InfoRow('Diputuskan', '${text(c['reviewed_by'])} • ${text(c['reviewed_at'])}${c['self_approved'] == true ? ' • disetujui sendiri' : ''}'),
          if (c['review_note'] != null) InfoRow('Catatan', text(c['review_note'])),
          if (pending)
            Row(mainAxisAlignment: MainAxisAlignment.end, children: [
              TextButton(onPressed: _busy ? null : _reject, style: TextButton.styleFrom(foregroundColor: Colors.red), child: const Text('Tolak')),
              const SizedBox(width: 8),
              FilledButton(onPressed: _busy ? null : _approve, child: const Text('Setujui')),
            ]),
        ]),
      ),
    );
  }
}

class _ApproveDialog extends StatefulWidget {
  final Map c;
  const _ApproveDialog(this.c);

  @override
  State<_ApproveDialog> createState() => _ApproveDialogState();
}

class _ApproveDialogState extends State<_ApproveDialog> {
  final _password = TextEditingController();
  final _note = TextEditingController();
  final _reference = TextEditingController();
  String? _billingResolution;
  String _refundMethod = 'TRANSFER';
  String? _payrollResolution;
  PlatformFile? _proof;
  bool _sending = false;

  Map? get _billing => widget.c['financial_effect']?['billing'];
  Map? get _payroll => widget.c['financial_effect']?['payroll'];
  bool get _needsBilling => _billing != null && (_billing!['paid_portion'] ?? 0) > 0;
  bool get _needsPayroll => _payroll != null && (_payroll!['delta'] ?? 0) < 0 && _payroll!['payroll_status'] != 'DRAFT';
  bool get _isSelf => widget.c['requested_by_id'] == auth.user?['id'];

  @override
  void dispose() {
    _password.dispose();
    _note.dispose();
    _reference.dispose();
    super.dispose();
  }

  Future<void> _pickProof() async {
    final files = await FilePicker.pickFiles(type: FileType.custom, allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf']);
    if (files.isEmpty || files.first.path == null) return;
    if (await File(files.first.path!).length() > 5 * 1024 * 1024) {
      if (mounted) showSnack(context, 'Ukuran bukti maksimal 5 MB.', error: true);
      return;
    }
    setState(() => _proof = files.first);
  }

  Future<void> _submit() async {
    if (_password.text.isEmpty) return showSnack(context, 'Masukkan password Anda untuk menyetujui.', error: true);
    if (_needsBilling && _billingResolution == null) return showSnack(context, 'Pilih refund atau kredit untuk dana yang sudah dibayar.', error: true);
    if (_billingResolution == 'REFUND' && _proof == null) return showSnack(context, 'Bukti pengembalian dana wajib diunggah.', error: true);
    if (_needsPayroll && _payrollResolution == null) return showSnack(context, 'Pilih cara menangani kelebihan honor.', error: true);

    final path = '/admin/attendances/corrections/${widget.c['id']}/approve';
    final fields = <String, String>{
      'password': _password.text,
      if (_note.text.trim().isNotEmpty) 'note': _note.text.trim(),
      if (_billingResolution != null && _needsBilling) 'billing_resolution': _billingResolution!,
      if (_payrollResolution != null && _needsPayroll) 'payroll_resolution': _payrollResolution!,
      if (_billingResolution == 'REFUND') 'refund_method': _refundMethod,
      if (_billingResolution == 'REFUND' && _reference.text.trim().isNotEmpty) 'refund_reference_no': _reference.text.trim(),
    };
    setState(() => _sending = true);
    final ok = await runAction(
      context,
      () => _billingResolution == 'REFUND' ? api.multipart(path, fields, 'refund_proof', _proof!.path!) : api.post(path, fields),
      'Koreksi disetujui.',
    );
    if (!mounted) return;
    setState(() => _sending = false);
    if (ok) Navigator.pop(context, true);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Setujui koreksi'),
      content: SingleChildScrollView(
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('${text(widget.c['student_name'])}: ${text(widget.c['old_status'])} → ${text(widget.c['new_status'])}',
              style: const TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 10),
          if (_needsBilling) ...[
            Text('Dana sudah dibayar ${rupiah(_billing!['paid_portion'])} perlu ditangani:'),
            Wrap(spacing: 6, children: [
              ChoiceChip(label: const Text('Kredit tagihan berikutnya'), selected: _billingResolution == 'CREDIT', onSelected: (_) => setState(() => _billingResolution = 'CREDIT')),
              ChoiceChip(label: const Text('Refund'), selected: _billingResolution == 'REFUND', onSelected: (_) => setState(() => _billingResolution = 'REFUND')),
            ]),
            if (_billingResolution == 'REFUND') ...[
              Wrap(spacing: 6, children: [
                for (final m in const ['TRANSFER', 'CASH'])
                  ChoiceChip(label: Text(m == 'CASH' ? 'Tunai' : 'Transfer'), selected: _refundMethod == m, onSelected: (_) => setState(() => _refundMethod = m)),
              ]),
              TextField(controller: _reference, decoration: const InputDecoration(labelText: 'No. referensi (opsional)')),
              OutlinedButton.icon(
                onPressed: _pickProof,
                icon: const Icon(Icons.attach_file),
                label: Text(_proof?.name ?? 'Unggah bukti pengembalian'),
              ),
            ],
            const SizedBox(height: 10),
          ],
          if (_needsPayroll) ...[
            Text('Kelebihan honor ${rupiah((_payroll!['delta'] as num).abs())}:'),
            Wrap(spacing: 6, children: [
              ChoiceChip(label: const Text('Potong honor berikutnya'), selected: _payrollResolution == 'DEDUCT', onSelected: (_) => setState(() => _payrollResolution = 'DEDUCT')),
              ChoiceChip(label: const Text('Minta dikembalikan'), selected: _payrollResolution == 'REFUND_REQUEST', onSelected: (_) => setState(() => _payrollResolution = 'REFUND_REQUEST')),
            ]),
            const SizedBox(height: 10),
          ],
          TextField(
            controller: _note,
            maxLines: 2,
            decoration: InputDecoration(labelText: _isSelf ? 'Alasan (wajib, min. 10 karakter, Anda pengajunya)' : 'Catatan (opsional)'),
          ),
          TextField(controller: _password, obscureText: true, decoration: const InputDecoration(labelText: 'Password Anda')),
        ]),
      ),
      actions: [
        TextButton(onPressed: _sending ? null : () => Navigator.pop(context, false), child: const Text('Batal')),
        FilledButton(onPressed: _sending ? null : _submit, child: Text(_sending ? 'Memproses...' : 'Setujui')),
      ],
    );
  }
}
