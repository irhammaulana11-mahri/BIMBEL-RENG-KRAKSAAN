import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';

/// Pendaftaran anak baru oleh orang tua (disetujui Admin). Setelah disetujui,
/// data login anak dikirim lewat notifikasi (ikon lonceng).
class ParentRegistrationScreen extends StatefulWidget {
  const ParentRegistrationScreen({super.key});

  @override
  State<ParentRegistrationScreen> createState() => _ParentRegistrationScreenState();
}

class _ParentRegistrationScreenState extends State<ParentRegistrationScreen> {
  final _key = GlobalKey<AsyncViewState>();

  Future<void> _openForm() async {
    final ok = await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => const _RegistrationForm()));
    if (ok == true) await _key.currentState?.reload();
  }

  Future<void> _cancel(Map r) async {
    try {
      final res = await api.patch('/parent/student-registrations/${r['id']}/cancel');
      if (mounted) showSnack(context, text(res['message'], 'Pengajuan dibatalkan.'));
      await _key.currentState?.reload();
    } catch (e) {
      if (mounted) showSnack(context, '$e', error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pendaftaran Anak')),
      floatingActionButton: FloatingActionButton.extended(onPressed: _openForm, icon: const Icon(Icons.person_add_alt), label: const Text('Daftarkan anak')),
      body: AsyncView<List>(
        key: _key,
        load: () async => (await api.get('/parent/student-registrations'))['data'],
        builder: (context, items, _) => ListView(padding: const EdgeInsets.fromLTRB(12, 12, 12, 90), children: [
          const Card(
            child: Padding(
              padding: EdgeInsets.all(14),
              child: Text('Pendaftaran ditinjau Admin. Setelah disetujui, email & password login anak dikirim ke notifikasi Anda.',
                  style: TextStyle(fontSize: 13)),
            ),
          ),
          if (items.isEmpty) const EmptyState('Belum ada pengajuan pendaftaran.', icon: Icons.child_care),
          for (final r in items)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Expanded(child: Text(text(r['full_name']), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16))),
                    StatusChip(r['status']),
                  ]),
                  const SizedBox(height: 4),
                  Text([
                    text(r['education_level']?['name']),
                    if (r['package'] != null) text(r['package']['name']),
                    if (r['school_name'] != null) text(r['school_name']),
                  ].join(' • '), style: const TextStyle(fontSize: 13, color: Colors.grey)),
                  if (r['student'] != null) Text('Terdaftar: NIS ${text(r['student']['nis'])}', style: TextStyle(fontSize: 13, color: Colors.green.shade700)),
                  if (r['review_note'] != null) Text('Catatan Admin: ${r['review_note']}', style: const TextStyle(fontSize: 13)),
                  if (r['status'] == 'PENDING')
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(style: TextButton.styleFrom(foregroundColor: Colors.red), onPressed: () => _cancel(r), child: const Text('Batalkan')),
                    ),
                ]),
              ),
            ),
        ]),
      ),
    );
  }
}

class _RegistrationForm extends StatefulWidget {
  const _RegistrationForm();

  @override
  State<_RegistrationForm> createState() => _RegistrationFormState();
}

class _RegistrationFormState extends State<_RegistrationForm> {
  final _name = TextEditingController();
  final _school = TextEditingController();
  final _email = TextEditingController();
  final _note = TextEditingController();
  String? _gender;
  DateTime? _birth;
  String? _levelId;
  String? _packageId;
  bool _saving = false;

  Future<void> _submit() async {
    if (_name.text.trim().isEmpty) return showSnack(context, 'Nama lengkap anak wajib diisi.', error: true);
    if (_levelId == null) return showSnack(context, 'Jenjang / kelas sekolah wajib dipilih.', error: true);
    setState(() => _saving = true);
    try {
      final res = await api.post('/parent/student-registrations', {
        'full_name': _name.text.trim(),
        'gender': _gender,
        'birth_date': _birth == null ? null : ymd(_birth!),
        'school_name': _school.text.trim().isEmpty ? null : _school.text.trim(),
        'education_level_id': _levelId,
        'package_id': _packageId,
        'login_email': _email.text.trim().isEmpty ? null : _email.text.trim(),
        'note': _note.text.trim().isEmpty ? null : _note.text.trim(),
      });
      if (!mounted) return;
      showSnack(context, text(res['message'], 'Pendaftaran terkirim.'));
      Navigator.pop(context, true);
    } catch (e) {
      if (mounted) showSnack(context, '$e', error: true);
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Daftarkan Anak Baru')),
      body: AsyncView<Map>(
        load: () async => (await api.get('/parent/registration-options'))['data'],
        builder: (context, opt, _) {
          final levels = opt['education_levels'] as List? ?? [];
          final level = levels.where((l) => l['id'] == _levelId).firstOrNull;
          final packages = (opt['packages'] as List? ?? []).where((p) => level == null || p['level'] == level['level']).toList();
          return ListView(padding: const EdgeInsets.all(16), children: [
            TextField(controller: _name, decoration: const InputDecoration(labelText: 'Nama lengkap anak *')),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _gender,
              decoration: const InputDecoration(labelText: 'Jenis kelamin'),
              items: const [DropdownMenuItem(value: 'L', child: Text('Laki-laki')), DropdownMenuItem(value: 'P', child: Text('Perempuan'))],
              onChanged: (v) => setState(() => _gender = v),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () async {
                final now = DateTime.now();
                final d = await showDatePicker(context: context, firstDate: DateTime(now.year - 25), lastDate: now, initialDate: DateTime(now.year - 8));
                if (d != null) setState(() => _birth = d);
              },
              icon: const Icon(Icons.cake_outlined),
              label: Text(_birth == null ? 'Pilih tanggal lahir' : tanggal(ymd(_birth!), withDay: false)),
            ),
            const SizedBox(height: 12),
            TextField(controller: _school, decoration: const InputDecoration(labelText: 'Asal sekolah')),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _levelId,
              isExpanded: true,
              decoration: const InputDecoration(labelText: 'Jenjang / kelas sekolah *'),
              items: [for (final l in levels) DropdownMenuItem(value: '${l['id']}', child: Text(text(l['name'])))],
              onChanged: (v) => setState(() { _levelId = v; _packageId = null; }),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              key: ValueKey(_levelId),
              initialValue: _packageId,
              isExpanded: true,
              decoration: const InputDecoration(labelText: 'Paket bimbingan (opsional)'),
              items: [
                for (final p in packages)
                  DropdownMenuItem(value: '${p['id']}', child: Text('${text(p['name'])} (${rupiah(p['price'])}/bln)', overflow: TextOverflow.ellipsis)),
              ],
              onChanged: (v) => setState(() => _packageId = v),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email login anak (opsional)', helperText: 'Kosongkan bila ingin dibuatkan otomatis'),
            ),
            const SizedBox(height: 12),
            TextField(controller: _note, maxLines: 3, decoration: const InputDecoration(labelText: 'Catatan (mapel fokus, jadwal yang diinginkan, dll.)')),
            const SizedBox(height: 20),
            FilledButton.icon(
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
              onPressed: _saving ? null : _submit,
              icon: const Icon(Icons.send),
              label: Text(_saving ? 'Mengirim...' : 'Kirim pendaftaran'),
            ),
          ]);
        },
      ),
    );
  }
}
