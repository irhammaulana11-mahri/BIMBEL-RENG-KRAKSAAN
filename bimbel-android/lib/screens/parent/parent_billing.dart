import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';
import '../../widgets/file_opener.dart';

class ParentBillingTab extends StatefulWidget {
  const ParentBillingTab({super.key});

  @override
  State<ParentBillingTab> createState() => _ParentBillingTabState();
}

class _ParentBillingTabState extends State<ParentBillingTab> {
  String _status = 'OPEN';

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
        child: SegmentedButton<String>(
          segments: const [
            ButtonSegment(value: 'OPEN', label: Text('Belum lunas')),
            ButtonSegment(value: 'PAID', label: Text('Lunas')),
            ButtonSegment(value: '', label: Text('Semua')),
          ],
          selected: {_status},
          onSelectionChanged: (v) => setState(() => _status = v.first),
        ),
      ),
      Expanded(
        child: AsyncView<Map>(
          key: ValueKey(_status),
          load: () async => await api.get('/parent/invoices', query: {'status': _status}),
          builder: (context, res, reload) {
            final invoices = res['data'] as List? ?? [];
            final summary = res['summary'] ?? {};
            return ListView(padding: const EdgeInsets.all(12), children: [
              StatGrid([
                StatCard(
                    label: 'Sisa tagihan',
                    value: rupiah(summary['outstanding']),
                    icon: Icons.account_balance_wallet_outlined,
                    color: Colors.red),
                StatCard(
                    label: 'Tagihan aktif',
                    value: '${summary['open_count'] ?? 0}',
                    icon: Icons.receipt_long_outlined,
                    color: Colors.blue),
                StatCard(
                    label: 'Jatuh tempo lewat',
                    value: '${summary['overdue_count'] ?? 0}',
                    icon: Icons.warning_amber_outlined,
                    color: Colors.orange),
              ]),
              const SizedBox(height: 8),
              if (invoices.isEmpty) const EmptyState('Tidak ada tagihan.', icon: Icons.receipt_long_outlined),
              for (final i in invoices)
                Card(
                  child: ListTile(
                    title: Text('${text(i['student_name'])} • ${periode(i['period_month'], i['period_year'])}'),
                    subtitle: Text([
                      '${text(i['invoice_no'])} • ${text(i['class_name'])}',
                      'Jatuh tempo ${tanggal(i['due_date'], withDay: false)}${i['is_overdue'] == true ? ' (lewat)' : ''}',
                      if (i['has_pending_payment'] == true) 'Pembayaran sedang diverifikasi',
                    ].join('\n')),
                    isThreeLine: true,
                    trailing: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: [
                      Text(rupiah(i['status'] == 'PAID' ? i['total_amount'] : i['remaining_amount']),
                          style: const TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      StatusChip(i['status']),
                    ]),
                    onTap: () async {
                      await Navigator.push(context, MaterialPageRoute(builder: (_) => InvoiceDetailScreen(i['id'])));
                      reload();
                    },
                  ),
                ),
            ]);
          },
        ),
      ),
    ]);
  }
}

class InvoiceDetailScreen extends StatefulWidget {
  final String invoiceId;
  const InvoiceDetailScreen(this.invoiceId, {super.key});

  @override
  State<InvoiceDetailScreen> createState() => _InvoiceDetailScreenState();
}

class _InvoiceDetailScreenState extends State<InvoiceDetailScreen> {
  final _key = GlobalKey<AsyncViewState>();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detail Tagihan'), actions: [
        IconButton(
          tooltip: 'Unduh invoice PDF',
          icon: const Icon(Icons.picture_as_pdf_outlined),
          onPressed: () => openPrivateFile(context, '/parent/invoices/${widget.invoiceId}/pdf', 'Invoice'),
        ),
      ]),
      body: AsyncView<Map>(
        key: _key,
        load: () async => (await api.get('/parent/invoices/${widget.invoiceId}'))['data'],
        builder: (context, inv, reload) {
          final items = inv['items'] as List? ?? [];
          final payments = inv['payments'] as List? ?? [];
          final pending = payments.any((p) => p['status'] == 'PENDING');
          final canPay = ['UNPAID', 'PARTIAL'].contains(inv['status']) && !pending;
          return ListView(padding: const EdgeInsets.all(12), children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(children: [
                  Row(children: [
                    Expanded(child: Text(text(inv['invoice_no']), style: const TextStyle(fontWeight: FontWeight.bold))),
                    StatusChip(inv['status']),
                  ]),
                  const Divider(),
                  InfoRow('Siswa', text(inv['student_name'])),
                  InfoRow('Kelas', text(inv['class_name'])),
                  InfoRow('Paket', text(inv['package_name'])),
                  InfoRow('Periode', periode(inv['period_month'], inv['period_year'])),
                  InfoRow('Jatuh tempo', tanggal(inv['due_date'])),
                  if (inv['note'] != null) InfoRow('Catatan', text(inv['note'])),
                ]),
              ),
            ),
            const SectionTitle('Rincian'),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(children: [
                  for (final it in items) InfoRow(text(it['item_name']), rupiah(it['subtotal'])),
                  if (items.isNotEmpty) const Divider(),
                  InfoRow('Subtotal', rupiah(inv['subtotal'])),
                  if ((inv['discount'] ?? 0) > 0) InfoRow('Diskon', '- ${rupiah(inv['discount'])}'),
                  InfoRow('Total', rupiah(inv['total_amount'])),
                  InfoRow('Dibayar', rupiah(inv['paid_amount'])),
                  InfoRow('Sisa', rupiah(inv['remaining_amount'])),
                ]),
              ),
            ),
            if (payments.isNotEmpty) ...[
              const SectionTitle('Riwayat pembayaran'),
              for (final p in payments)
                Card(
                  child: ListTile(
                    title: Text(rupiah(p['amount'])),
                    subtitle: Text('${text(p['payment_no'])} • ${tanggal(p['payment_date'], withDay: false)}'
                        '${p['reversed'] == true ? '\nDibatalkan admin: ${text(p['reversal_reason'])}' : ''}'),
                    trailing: StatusChip(p['reversed'] == true ? 'REVERSED' : p['status']),
                  ),
                ),
            ],
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(44)),
                icon: const Icon(Icons.picture_as_pdf_outlined),
                label: const Text('Unduh invoice PDF'),
                onPressed: () => openPrivateFile(context, '/parent/invoices/${widget.invoiceId}/pdf', 'Invoice ${text(inv['invoice_no'])}'),
              ),
            ),
            if (pending)
              const Padding(
                padding: EdgeInsets.all(12),
                child: Text('Bukti pembayaran sedang diverifikasi admin.', textAlign: TextAlign.center),
              ),
            if (canPay)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                  icon: const Icon(Icons.upload_file),
                  label: const Text('Kirim bukti transfer'),
                  onPressed: () async {
                    final sent = await Navigator.push<bool>(
                        context, MaterialPageRoute(builder: (_) => _PaymentFormScreen(inv)));
                    if (sent == true) reload();
                  },
                ),
              ),
          ]);
        },
      ),
    );
  }
}

class _PaymentFormScreen extends StatefulWidget {
  final Map invoice;
  const _PaymentFormScreen(this.invoice);

  @override
  State<_PaymentFormScreen> createState() => _PaymentFormScreenState();
}

class _PaymentFormScreenState extends State<_PaymentFormScreen> {
  final _form = GlobalKey<FormState>();
  late final _amount = TextEditingController(text: '${(widget.invoice['remaining_amount'] as num?)?.round() ?? ''}');
  final _channel = TextEditingController();
  final _reference = TextEditingController();
  final _note = TextEditingController();
  DateTime _date = DateTime.now();
  PlatformFile? _proof;
  bool _sending = false;

  Future<void> _pickProof() async {
    final files = await FilePicker.pickFiles(type: FileType.custom, allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf']);
    if (files.isEmpty || files.first.path == null) return;
    final file = files.first;
    if (await File(file.path!).length() > 5 * 1024 * 1024) {
      if (mounted) showSnack(context, 'Ukuran bukti transfer maksimal 5 MB.', error: true);
      return;
    }
    setState(() => _proof = file);
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    if (_proof == null) return showSnack(context, 'Bukti transfer wajib diunggah.', error: true);
    setState(() => _sending = true);
    try {
      final res = await api.multipart('/parent/invoices/${widget.invoice['id']}/payments', {
        'amount': _amount.text.replaceAll(RegExp(r'[^0-9]'), ''),
        'payment_date': ymd(_date),
        'payment_channel': _channel.text.trim(),
        if (_reference.text.trim().isNotEmpty) 'reference_no': _reference.text.trim(),
        if (_note.text.trim().isNotEmpty) 'note': _note.text.trim(),
      }, 'proof', _proof!.path!);
      if (!mounted) return;
      showSnack(context, text(res['message'], 'Bukti pembayaran terkirim.'));
      Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        showSnack(context, '$e', error: true);
        setState(() => _sending = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Kirim Bukti Transfer')),
      body: Form(
        key: _form,
        child: ListView(padding: const EdgeInsets.all(16), children: [
          Text('Sisa tagihan: ${rupiah(widget.invoice['remaining_amount'])}', style: const TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          TextFormField(
            controller: _amount,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Jumlah dibayar (Rp)'),
            validator: (v) => (int.tryParse(v?.replaceAll(RegExp(r'[^0-9]'), '') ?? '') ?? 0) <= 0 ? 'Jumlah tidak valid' : null,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _channel,
            decoration: const InputDecoration(labelText: 'Bank / channel', hintText: 'mis. BCA, BRI, DANA'),
            validator: (v) => (v == null || v.trim().isEmpty) ? 'Bank / channel wajib diisi' : null,
          ),
          const SizedBox(height: 12),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.event),
            title: const Text('Tanggal transfer'),
            subtitle: Text(tanggal(ymd(_date))),
            onTap: () async {
              final d = await showDatePicker(
                  context: context, initialDate: _date, firstDate: DateTime(2020), lastDate: DateTime.now());
              if (d != null) setState(() => _date = d);
            },
          ),
          TextFormField(controller: _reference, decoration: const InputDecoration(labelText: 'No. referensi (opsional)')),
          const SizedBox(height: 12),
          TextFormField(controller: _note, maxLines: 2, decoration: const InputDecoration(labelText: 'Catatan (opsional)')),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _pickProof,
            icon: const Icon(Icons.attach_file),
            label: Text(_proof?.name ?? 'Pilih bukti transfer (JPG/PNG/PDF, maks. 5 MB)'),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _sending ? null : _submit,
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
            child: _sending ? const CircularProgressIndicator() : const Text('Kirim'),
          ),
        ]),
      ),
    );
  }
}
