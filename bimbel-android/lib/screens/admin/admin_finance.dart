import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';
import '../../widgets/file_opener.dart';

/// Minta alasan (wajib) sebelum menolak. Null jika dibatalkan.
Future<String?> askReason(BuildContext context, String title) {
  final controller = TextEditingController();
  return showDialog<String>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(title),
      content: TextField(
        controller: controller,
        autofocus: true,
        maxLines: 3,
        decoration: const InputDecoration(labelText: 'Alasan penolakan'),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
        FilledButton(
          onPressed: () {
            if (controller.text.trim().length < 3) {
              showSnack(ctx, 'Alasan minimal 3 karakter.', error: true);
              return;
            }
            Navigator.pop(ctx, controller.text.trim());
          },
          child: const Text('Tolak'),
        ),
      ],
    ),
  );
}

/// Jalankan aksi API lalu tampilkan pesan server. True jika berhasil.
Future<bool> runAction(BuildContext context, Future<dynamic> Function() action, String fallback) async {
  try {
    final res = await action();
    if (context.mounted) showSnack(context, res is Map && res['message'] is String ? res['message'] : fallback);
    return true;
  } catch (e) {
    if (context.mounted) showSnack(context, '$e', error: true);
    return false;
  }
}

/*
|--------------------------------------------------------------------------
| PEMBAYARAN: verifikasi bukti transfer
|--------------------------------------------------------------------------
*/

class AdminPaymentsTab extends StatefulWidget {
  const AdminPaymentsTab({super.key});

  @override
  State<AdminPaymentsTab> createState() => _AdminPaymentsTabState();
}

class _AdminPaymentsTabState extends State<AdminPaymentsTab> {
  String _status = 'PENDING';
  // Periode: ALL (semua tanggal), DAY (satu tanggal), MONTH (satu bulan)
  String _mode = 'MONTH';
  DateTime _date = DateTime.now();
  String _keyword = '';
  int _page = 1;
  final _search = TextEditingController();
  Timer? _debounce;

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    super.dispose();
  }

  Map<String, dynamic> get _query => {
        'status': _status,
        'keyword': _keyword,
        'page': _page,
        'per_page': 20,
        // Pembayaran menunggu verifikasi selalu ditampilkan semua agar tidak ada yang terlewat
        if (_status != 'PENDING' && _mode == 'DAY') 'date': ymd(_date),
        if (_status != 'PENDING' && _mode == 'MONTH') 'period': DateFormat('yyyy-MM').format(_date),
      };

  Future<void> _pickDate() async {
    if (_mode == 'DAY') {
      final d = await showDatePicker(context: context, firstDate: DateTime(2024), lastDate: DateTime.now(), initialDate: _date);
      if (d != null) setState(() { _date = d; _page = 1; });
    } else {
      // Bulanan: pilih tanggal mana saja di bulan yang diinginkan
      final d = await showDatePicker(
        context: context, firstDate: DateTime(2024), lastDate: DateTime.now(), initialDate: _date,
        initialDatePickerMode: DatePickerMode.year, helpText: 'Pilih bulan',
      );
      if (d != null) setState(() { _date = d; _page = 1; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final periodLabel = _mode == 'DAY'
        ? tanggal(ymd(_date))
        : DateFormat('MMMM yyyy', 'id_ID').format(_date);
    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
        child: SegmentedButton<String>(
          segments: const [
            ButtonSegment(value: 'PENDING', label: Text('Menunggu')),
            ButtonSegment(value: 'CONFIRMED', label: Text('Diterima')),
            ButtonSegment(value: 'REJECTED', label: Text('Ditolak')),
          ],
          selected: {_status},
          onSelectionChanged: (v) => setState(() { _status = v.first; _page = 1; }),
        ),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
        child: TextField(
          controller: _search,
          decoration: InputDecoration(
            isDense: true,
            prefixIcon: const Icon(Icons.search),
            hintText: 'Cari siswa / no. bayar / referensi',
            suffixIcon: _keyword.isEmpty ? null : IconButton(icon: const Icon(Icons.close), onPressed: () { _search.clear(); setState(() { _keyword = ''; _page = 1; }); }),
          ),
          onChanged: (v) {
            _debounce?.cancel();
            _debounce = Timer(const Duration(milliseconds: 400), () => setState(() { _keyword = v.trim(); _page = 1; }));
          },
        ),
      ),
      if (_status != 'PENDING')
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
          child: Row(children: [
            for (final m in const [('ALL', 'Semua'), ('DAY', 'Harian'), ('MONTH', 'Bulanan')])
              Padding(
                padding: const EdgeInsets.only(right: 6),
                child: ChoiceChip(label: Text(m.$2), selected: _mode == m.$1, onSelected: (_) => setState(() { _mode = m.$1; _page = 1; })),
              ),
            const Spacer(),
            if (_mode != 'ALL')
              TextButton.icon(onPressed: _pickDate, icon: const Icon(Icons.calendar_month, size: 18), label: Text(periodLabel)),
          ]),
        ),
      Expanded(
        child: AsyncView<Map>(
          key: ValueKey('$_status|$_mode|${ymd(_date)}|$_keyword|$_page'),
          load: () async => await api.get('/admin/finance/payments', query: _query),
          builder: (context, res, reload) {
            final payments = res['data'] as List? ?? [];
            final meta = res['meta'] as Map? ?? {};
            final filtered = (res['summary'] as Map?)?['filtered'] as Map? ?? {};
            final lastPage = (meta['last_page'] ?? 1) as int;
            return ListView(padding: const EdgeInsets.all(12), children: [
              // Rekap sesuai filter aktif
              StatGrid([
                StatCard(label: 'Jumlah pembayaran', value: '${filtered['count'] ?? 0}', icon: Icons.receipt_long, color: Colors.indigo),
                StatCard(label: 'Total nominal', value: rupiah(filtered['amount'] ?? 0), icon: Icons.payments, color: Colors.green),
              ]),
              const SizedBox(height: 4),
              if (payments.isEmpty) const EmptyState('Tidak ada pembayaran untuk filter ini.', icon: Icons.payments_outlined),
              for (final p in payments)
                Card(
                  child: ListTile(
                    title: Text(text(p['student_name'])),
                    subtitle: Text([
                      '${text(p['payment_no'])} • ${p['payment_method'] == 'CASH' ? 'Tunai' : 'Transfer'}',
                      '${tanggal(p['payment_date'], withDay: false)} • oleh ${text(p['submitted_by'] ?? p['received_by'])}',
                    ].join('\n')),
                    isThreeLine: true,
                    trailing: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: [
                      Text(rupiah(p['total_amount']), style: const TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      StatusChip(p['status']),
                    ]),
                    onTap: () async {
                      await Navigator.push(context, MaterialPageRoute(builder: (_) => _PaymentDetailScreen(p['id'])));
                      reload();
                    },
                  ),
                ),
              if (lastPage > 1)
                Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  IconButton(onPressed: _page > 1 ? () => setState(() => _page--) : null, icon: const Icon(Icons.chevron_left)),
                  Text('Halaman $_page dari $lastPage'),
                  IconButton(onPressed: _page < lastPage ? () => setState(() => _page++) : null, icon: const Icon(Icons.chevron_right)),
                ]),
            ]);
          },
        ),
      ),
    ]);
  }
}

class _PaymentDetailScreen extends StatefulWidget {
  final String paymentId;
  const _PaymentDetailScreen(this.paymentId);

  @override
  State<_PaymentDetailScreen> createState() => _PaymentDetailScreenState();
}

class _PaymentDetailScreenState extends State<_PaymentDetailScreen> {
  bool _busy = false;

  Future<void> _act(Future<dynamic> Function() action, String fallback) async {
    setState(() => _busy = true);
    final ok = await runAction(context, action, fallback);
    if (!mounted) return;
    setState(() => _busy = false);
    if (ok) Navigator.pop(context);
  }

  Future<void> _approve(Map p) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Terima pembayaran'),
        content: Text('Terima ${rupiah(p['total_amount'])} dari ${text(p['student_name'])}? Tagihan akan diperbarui.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Terima')),
        ],
      ),
    );
    if (ok == true) await _act(() => api.patch('/admin/finance/payments/${p['id']}/approve'), 'Pembayaran diterima.');
  }

  Future<void> _reject(Map p) async {
    final reason = await askReason(context, 'Tolak pembayaran');
    if (reason != null) {
      await _act(() => api.patch('/admin/finance/payments/${p['id']}/reject', {'reason': reason}), 'Pembayaran ditolak.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detail Pembayaran')),
      body: AsyncView<Map>(
        load: () async => (await api.get('/admin/finance/payments/${widget.paymentId}'))['data'],
        builder: (context, p, reload) {
          final invoices = p['invoices'] as List? ?? [];
          return ListView(padding: const EdgeInsets.all(12), children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(children: [
                  Row(children: [
                    Expanded(child: Text(text(p['payment_no']), style: const TextStyle(fontWeight: FontWeight.bold))),
                    StatusChip(p['status']),
                  ]),
                  const Divider(),
                  InfoRow('Siswa', text(p['student_name'])),
                  InfoRow('Jumlah', rupiah(p['total_amount'])),
                  InfoRow('Tanggal bayar', tanggal(p['payment_date'])),
                  InfoRow('Metode', p['payment_method'] == 'CASH' ? 'Tunai' : 'Transfer'),
                  InfoRow('Bank / kanal', text(p['payment_channel'])),
                  InfoRow('No. referensi', text(p['reference_no'])),
                  InfoRow('Catatan', text(p['note'])),
                  InfoRow('Dikirim oleh', text(p['submitted_by'])),
                  InfoRow('Dikirim', text(p['created_at'])),
                  if (p['received_by'] != null) InfoRow('Diverifikasi oleh', text(p['received_by'])),
                  if (p['reject_reason'] != null) InfoRow('Alasan tolak', text(p['reject_reason'])),
                ]),
              ),
            ),
            if (p['has_proof'] == true)
              OutlinedButton.icon(
                onPressed: () => openPrivateFile(context, '/admin/finance/payments/${p['id']}/proof', 'Bukti ${p['payment_no']}'),
                icon: const Icon(Icons.image_outlined),
                label: const Text('Lihat bukti transfer'),
              ),
            const SectionTitle('Dialokasikan ke tagihan'),
            for (final i in invoices)
              Card(
                child: ListTile(
                  title: Text(text(i['invoice_no'])),
                  subtitle: Text('Sisa tagihan ${rupiah(i['remaining_amount'])}'),
                  trailing: Text(rupiah(i['amount']), style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            if (p['status'] == 'PENDING') ...[
              const SizedBox(height: 16),
              Row(children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _busy ? null : () => _reject(p),
                    icon: const Icon(Icons.close),
                    label: const Text('Tolak'),
                    style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton.icon(
                    onPressed: _busy ? null : () => _approve(p),
                    icon: const Icon(Icons.check),
                    label: const Text('Terima'),
                  ),
                ),
              ]),
            ],
          ]);
        },
      ),
    );
  }
}

/*
|--------------------------------------------------------------------------
| TAGIHAN: cari tagihan terbuka & catat pembayaran langsung
|--------------------------------------------------------------------------
*/

class AdminInvoicesTab extends StatefulWidget {
  const AdminInvoicesTab({super.key});

  @override
  State<AdminInvoicesTab> createState() => _AdminInvoicesTabState();
}

class _AdminInvoicesTabState extends State<AdminInvoicesTab> {
  final _search = TextEditingController();
  String _keyword = '';
  bool _overdueOnly = false;

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
        child: TextField(
          controller: _search,
          textInputAction: TextInputAction.search,
          decoration: InputDecoration(
            isDense: true,
            prefixIcon: const Icon(Icons.search),
            hintText: 'Cari nama siswa / ortu / no. tagihan',
            suffixIcon: _keyword.isEmpty
                ? null
                : IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: () => setState(() {
                      _search.clear();
                      _keyword = '';
                    }),
                  ),
          ),
          onSubmitted: (v) => setState(() => _keyword = v.trim()),
        ),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Row(children: [
          FilterChip(
            label: const Text('Lewat jatuh tempo'),
            selected: _overdueOnly,
            onSelected: (v) => setState(() => _overdueOnly = v),
          ),
        ]),
      ),
      Expanded(
        child: AsyncView<Map>(
          key: ValueKey('$_keyword|$_overdueOnly'),
          load: () async => await api.get('/admin/finance/invoices', query: {
            'status': 'OPEN',
            'keyword': _keyword,
            if (_overdueOnly) 'overdue': 1,
            'per_page': 50,
          }),
          builder: (context, res, reload) {
            final invoices = res['data'] as List? ?? [];
            final summary = res['summary'] ?? {};
            return ListView(padding: const EdgeInsets.fromLTRB(12, 0, 12, 12), children: [
              StatGrid([
                StatCard(label: 'Tagihan belum lunas', value: '${summary['count'] ?? 0}', icon: Icons.receipt_long_outlined),
                StatCard(
                    label: 'Total sisa',
                    value: rupiah(summary['remaining_amount']),
                    icon: Icons.account_balance_wallet_outlined,
                    color: Colors.red),
              ]),
              const SizedBox(height: 8),
              if (invoices.isEmpty) const EmptyState('Tidak ada tagihan belum lunas.', icon: Icons.task_alt),
              for (final i in invoices)
                Card(
                  child: ListTile(
                    title: Text('${text(i['student_name'])} • ${periode(i['period_month'], i['period_year'])}'),
                    subtitle: Text([
                      '${text(i['invoice_no'])} • ${text(i['class_name'])}',
                      'Jatuh tempo ${tanggal(i['due_date'], withDay: false)}${i['is_overdue'] == true ? ' (lewat)' : ''}',
                      if (i['has_pending_payment'] == true) 'Ada bukti bayar menunggu verifikasi',
                    ].join('\n')),
                    isThreeLine: true,
                    trailing: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: [
                      Text(rupiah(i['remaining_amount']), style: const TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      StatusChip(i['status']),
                    ]),
                    onTap: () async {
                      if (await _recordPayment(context, i) == true) reload();
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

/// Catat pembayaran yang sudah diterima Admin (langsung terverifikasi) untuk satu tagihan.
Future<bool?> _recordPayment(BuildContext context, Map invoice) {
  final remaining = num.tryParse('${invoice['remaining_amount']}') ?? 0;
  final amount = TextEditingController(text: remaining.toStringAsFixed(0));
  final channel = TextEditingController();
  final note = TextEditingController();
  var method = 'CASH';
  var date = DateTime.now();
  var saving = false;

  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setState) => Padding(
        padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(ctx).viewInsets.bottom + 16),
        child: SingleChildScrollView(
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, mainAxisSize: MainAxisSize.min, children: [
            Text('Catat Pembayaran', style: Theme.of(ctx).textTheme.titleLarge),
            const SizedBox(height: 4),
            Text('${text(invoice['student_name'])} • ${text(invoice['invoice_no'])}\nSisa ${rupiah(remaining)}',
                style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 16),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'CASH', label: Text('Tunai'), icon: Icon(Icons.payments_outlined)),
                ButtonSegment(value: 'TRANSFER', label: Text('Transfer'), icon: Icon(Icons.account_balance_outlined)),
              ],
              selected: {method},
              onSelectionChanged: (v) => setState(() => method = v.first),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: amount,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Jumlah (Rp)'),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () async {
                final picked = await showDatePicker(
                  context: ctx,
                  initialDate: date,
                  firstDate: DateTime.now().subtract(const Duration(days: 365)),
                  lastDate: DateTime.now(),
                );
                if (picked != null) setState(() => date = picked);
              },
              icon: const Icon(Icons.event),
              label: Text('Tanggal bayar: ${tanggal(ymd(date))}'),
            ),
            if (method == 'TRANSFER') ...[
              const SizedBox(height: 12),
              TextField(controller: channel, decoration: const InputDecoration(labelText: 'Bank / kanal (opsional)')),
            ],
            const SizedBox(height: 12),
            TextField(controller: note, decoration: const InputDecoration(labelText: 'Catatan (opsional)')),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: saving
                  ? null
                  : () async {
                      final value = num.tryParse(amount.text.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
                      if (value <= 0 || value > remaining) {
                        showSnack(ctx, 'Jumlah harus antara 1 dan ${rupiah(remaining)}.', error: true);
                        return;
                      }
                      setState(() => saving = true);
                      final ok = await runAction(
                        ctx,
                        () => api.post('/admin/finance/payments', {
                          'student_id': invoice['student_id'],
                          'payment_date': ymd(date),
                          'payment_method': method,
                          'payment_channel': method == 'TRANSFER' ? channel.text.trim() : null,
                          'note': note.text.trim(),
                          'allocations': [
                            {'invoice_id': invoice['id'], 'amount': value},
                          ],
                        }),
                        'Pembayaran berhasil dicatat.',
                      );
                      if (ok && ctx.mounted) {
                        Navigator.pop(ctx, true);
                      } else {
                        setState(() => saving = false);
                      }
                    },
              child: const Text('Simpan Pembayaran'),
            ),
          ]),
        ),
      ),
    ),
  );
}
