import 'package:flutter/material.dart';

import '../../api/api_client.dart';
import '../../widgets/common.dart';
import '../../widgets/location.dart';
import 'tentor_activity_form.dart';
import '../../widgets/requests.dart';

const _attendanceOptions = ['HADIR', 'IZIN', 'SAKIT', 'ALPA'];
const _activityLabels = {'MATERIAL': 'Materi', 'DISCUSSION': 'Diskusi', 'EXAM': 'Ujian', 'REVIEW': 'Review'};

/// Ruang kerja sesi: absen masuk GPS & mulai sesi, jalankan aktivitas, isi absensi siswa, absen pulang.
class TentorWorkspaceScreen extends StatefulWidget {
  final String sessionId;
  const TentorWorkspaceScreen(this.sessionId, {super.key});

  @override
  State<TentorWorkspaceScreen> createState() => _TentorWorkspaceScreenState();
}

class _TentorWorkspaceScreenState extends State<TentorWorkspaceScreen> {
  final _key = GlobalKey<AsyncViewState>();
  final _attendance = <String, String>{};
  bool _busy = false;

  String get _base => '/tentor/sessions/${widget.sessionId}';

  Future<void> _action(Future<dynamic> Function() call, {String? confirm}) async {
    if (confirm != null) {
      final ok = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          content: Text(confirm),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
            FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Ya')),
          ],
        ),
      );
      if (ok != true) return;
    }
    setState(() => _busy = true);
    try {
      final res = await call();
      if (mounted && res is Map && res['message'] != null) showSnack(context, '${res['message']}');
      _attendance.clear();
      await _key.currentState?.reload();
    } catch (e) {
      if (mounted) showSnack(context, '$e', error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  // Tekan lama aktivitas: batalkan (siap/berjalan) atau hapus (masih siap)
  Future<void> _activityMenu(Map a) async {
    final action = await showModalBottomSheet<String>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          ListTile(title: Text(text(a['title']), style: const TextStyle(fontWeight: FontWeight.bold))),
          ListTile(
            leading: const Icon(Icons.cancel_outlined),
            title: const Text('Batalkan aktivitas'),
            onTap: () => Navigator.pop(ctx, 'cancel'),
          ),
          if (a['status'] == 'READY')
            ListTile(
              leading: const Icon(Icons.delete_outline, color: Colors.red),
              title: const Text('Hapus aktivitas', style: TextStyle(color: Colors.red)),
              onTap: () => Navigator.pop(ctx, 'delete'),
            ),
        ]),
      ),
    );
    if (action == null) return;
    await _action(
      () => action == 'delete'
          ? api.delete('$_base/activities/${a['id']}')
          : api.patch('$_base/activities/${a['id']}/cancel'),
      confirm: action == 'delete' ? 'Hapus aktivitas ini?' : 'Batalkan aktivitas ini?',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ruang Kerja Sesi')),
      body: AsyncView<Map>(
        key: _key,
        load: () async => (await api.get('$_base/workspace'))['data'],
        builder: (context, s, _) {
          final status = s['status'];
          final students = s['students'] as List? ?? [];
          final activities = s['activities'] as List? ?? [];
          final ta = s['tentor_attendance'];
          final running = status == 'IN_PROGRESS';
          final locked = status == 'COMPLETED' || status == 'CANCELLED';
          final needsGps = s['attendance_target']?['requires_gps'] == true;
          final remarks = (ta?['remarks'] as List? ?? []).join(' • ');
          return ListView(padding: const EdgeInsets.all(12), children: [
            SessionCard({...s, 'location_name': s['location']}),
            if (ta != null)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Masuk ${text(ta['checkin_time'])} • Pulang ${text(ta['checkout_time'])}'),
                    if (ta['location']?['target_label'] != null)
                      Text('Lokasi absen: ${ta['location']['target_label']}'
                          '${ta['location']['checkin_distance_meter'] != null ? ' (±${ta['location']['checkin_distance_meter']} m)' : ''}',
                          style: const TextStyle(fontSize: 12, color: Colors.grey)),
                    if (remarks.isNotEmpty)
                      Text(remarks, style: TextStyle(fontSize: 12, color: Colors.orange.shade800, fontWeight: FontWeight.w600)),
                  ]),
                ),
              ),
            const SizedBox(height: 8),
            if (['SCHEDULED', 'RESCHEDULED', 'PREPARING'].contains(status))
              _CheckInCard(
                session: s,
                busy: _busy,
                onCheckIn: (position) => _action(() => api.post('$_base/start', {...position, 'source': 'ANDROID'})),
                onChanged: () => _key.currentState?.reload(),
                base: _base,
              ),
            if (running)
              FilledButton.tonalIcon(
                onPressed: _busy
                    ? null
                    : () => _action(() async {
                          // Absen pulang: lokasi GPS ikut dicatat untuk kelas tatap muka
                          final position = needsGps ? await currentPosition() : <String, dynamic>{};
                          return api.post('$_base/end', {...position, 'source': 'ANDROID'});
                        },
                        confirm: needsGps
                            ? 'Akhiri sesi? Pastikan absensi siswa sudah disimpan. Lokasi GPS dicatat sebagai absen pulang.'
                            : 'Akhiri sesi? Pastikan absensi siswa sudah disimpan.'),
                icon: const Icon(Icons.stop),
                label: const Text('Akhiri sesi'),
              ),
            SectionTitle('Aktivitas',
                trailing: locked
                    ? null
                    : TextButton.icon(
                        onPressed: _busy
                            ? null
                            : () async {
                                final added = await Navigator.push<bool>(
                                    context, MaterialPageRoute(builder: (_) => TentorActivityForm(s)));
                                if (added == true) _key.currentState?.reload();
                              },
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text('Tambah'),
                      )),
            if (activities.isEmpty) const EmptyState('Belum ada aktivitas. Tekan "Tambah" untuk menyusun agenda pertemuan.'),
            for (final a in activities)
              Card(
                child: ListTile(
                  title: Text(text(a['title'])),
                  subtitle: Text([
                    _activityLabels[a['type']] ?? text(a['type']),
                    if (a['start_time'] != null) '${a['start_time']} - ${text(a['end_time'])}',
                    if (a['reference_title'] != null) a['reference_title'],
                    if (a['type'] == 'EXAM') '${a['exam_submitted'] ?? 0} terkumpul • ${a['exam_pending'] ?? 0} perlu dinilai',
                  ].join(' • ')),
                  trailing: running && a['status'] == 'READY'
                      ? IconButton(
                          tooltip: 'Mulai',
                          icon: const Icon(Icons.play_circle_outline),
                          onPressed: _busy ? null : () => _action(() => api.patch('$_base/activities/${a['id']}/start')),
                        )
                      : running && a['status'] == 'IN_PROGRESS'
                          ? IconButton(
                              tooltip: 'Selesai',
                              icon: const Icon(Icons.check_circle_outline),
                              onPressed:
                                  _busy ? null : () => _action(() => api.patch('$_base/activities/${a['id']}/complete')),
                            )
                          : StatusChip(a['status']),
                  onLongPress: locked || !['READY', 'IN_PROGRESS'].contains(a['status']) ? null : () => _activityMenu(a),
                ),
              ),
            SectionTitle('Absensi siswa (${students.length})',
                trailing: students.isEmpty
                    ? null
                    : TextButton(
                        onPressed: () => setState(() {
                          for (final st in students) {
                            _attendance['${st['student_id']}'] = 'HADIR';
                          }
                        }),
                        child: const Text('Semua hadir'),
                      )),
            if (students.isEmpty) const EmptyState('Belum ada siswa di kelas ini.'),
            for (final st in students)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(text(st['full_name']), style: const TextStyle(fontWeight: FontWeight.w600)),
                    Text('NIS ${text(st['nis'])} • ${text(st['school_name'])}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                    const SizedBox(height: 6),
                    Wrap(spacing: 6, children: [
                      for (final opt in _attendanceOptions)
                        ChoiceChip(
                          label: Text(opt[0] + opt.substring(1).toLowerCase()),
                          selected: (_attendance['${st['student_id']}'] ?? st['attendance_status']) == opt,
                          onSelected: (_) => setState(() => _attendance['${st['student_id']}'] = opt),
                        ),
                    ]),
                  ]),
                ),
              ),
            if (students.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                  onPressed: _busy || _attendance.isEmpty
                      ? null
                      : () => _action(() => api.post('$_base/attendance', {
                            'attendances': [
                              for (final st in students)
                                {
                                  'student_id': st['student_id'],
                                  'attendance_status': _attendance['${st['student_id']}'] ?? st['attendance_status'] ?? 'BELUM',
                                  'note': st['note'],
                                }
                            ],
                          })),
                  icon: const Icon(Icons.save),
                  label: const Text('Simpan absensi'),
                ),
              ),
          ]);
        },
      ),
    );
  }
}

/// Absen masuk: titik sasaran, jarak dari GPS, dan pengajuan lokasi sementara.
/// Di luar radius / di luar jam tetap boleh absen; server memberi keterangan.
class _CheckInCard extends StatefulWidget {
  final Map session;
  final bool busy;
  final String base;
  final Future<void> Function(Map<String, dynamic> position) onCheckIn;
  final VoidCallback onChanged;
  const _CheckInCard({required this.session, required this.busy, required this.base, required this.onCheckIn, required this.onChanged});

  @override
  State<_CheckInCard> createState() => _CheckInCardState();
}

class _CheckInCardState extends State<_CheckInCard> {
  Map<String, dynamic>? _position;
  String? _error;
  bool _locating = false;

  Map get _target => widget.session['attendance_target'] ?? {};
  bool get _needsGps => _target['requires_gps'] == true;

  @override
  void initState() {
    super.initState();
    if (_needsGps) _locate();
  }

  Future<void> _locate() async {
    setState(() {
      _locating = true;
      _error = null;
    });
    try {
      final p = await currentPosition();
      if (mounted) setState(() => _position = p);
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  Future<void> _requestLocation() async {
    final ok = await showLocationRequestDialog(context, widget.session,
        (body) async => (await api.post('${widget.base}/location-request', body))['message']);
    if (ok == true) widget.onChanged();
  }

  // Pindah jadwal sesi ini; masuk ke persetujuan Admin
  Future<void> _requestReschedule() async {
    final ok = await showRescheduleDialog(context, widget.session, (date, time, reason) async {
      final res = await api.post('${widget.base}/reschedule-request', {'proposed_date': ymd(date), 'proposed_time': hhmm(time), 'reason': reason});
      return res['message'];
    });
    if (ok == true) widget.onChanged();
  }

  Future<void> _cancelRequest(String id) async {
    try {
      final res = await api.patch('/tentor/location-requests/$id/cancel');
      if (mounted) showSnack(context, text(res['message'], 'Pengajuan dibatalkan.'));
      widget.onChanged();
    } catch (e) {
      if (mounted) showSnack(context, '$e', error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = _target;
    final hasTarget = t['latitude'] != null && t['longitude'] != null;
    final distance = _position != null && hasTarget
        ? distanceMeter(_position!['latitude'], _position!['longitude'], t['latitude'], t['longitude']).round()
        : null;
    final outside = distance != null && distance > (t['radius_meter'] ?? 100);
    final request = widget.session['location_change_request'];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Absen Masuk', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const Text('Absen masuk sekaligus memulai sesi.', style: TextStyle(fontSize: 12, color: Colors.grey)),
          const SizedBox(height: 8),
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Icon(t['type'] == 'ONLINE' ? Icons.videocam_outlined : Icons.place_outlined, size: 20),
            const SizedBox(width: 6),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(text(t['label']), style: const TextStyle(fontWeight: FontWeight.w600)),
                if (t['address'] != null) Text(text(t['address']), style: const TextStyle(fontSize: 12, color: Colors.grey)),
                if (hasTarget)
                  InkWell(
                    onTap: () => openUrl(context, mapsUrl(t['latitude'], t['longitude'])),
                    child: Text('Toleransi ${t['radius_meter']} m • Lihat di peta',
                        style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.primary)),
                  ),
                if (_needsGps && !hasTarget)
                  const Text('Titik lokasi belum diatur Admin. Posisi Anda tetap dicatat.',
                      style: TextStyle(fontSize: 12, color: Colors.orange)),
                if (t['type'] == 'ONLINE') const Text('Kelas online tidak memerlukan GPS.', style: TextStyle(fontSize: 12, color: Colors.grey)),
              ]),
            ),
          ]),
          if (_needsGps) ...[
            const SizedBox(height: 8),
            if (_locating)
              const Row(children: [
                SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                SizedBox(width: 8),
                Text('Mengambil lokasi GPS...'),
              ])
            else if (_error != null)
              Text(_error!, style: const TextStyle(color: Colors.red))
            else if (_position != null)
              Text(
                distance == null
                    ? 'Lokasi Anda didapat (akurasi ±${(_position!['accuracy'] as double).round()} m).'
                    : outside
                        ? 'Anda ±$distance m dari lokasi (melebihi ${t['radius_meter']} m). Absen tetap bisa, diberi keterangan di luar lokasi.'
                        : 'Dalam area (±$distance m dari lokasi).',
                style: TextStyle(color: outside ? Colors.orange.shade800 : Colors.green.shade700, fontWeight: FontWeight.w600),
              ),
            if (!_locating)
              TextButton.icon(
                onPressed: _locate,
                icon: const Icon(Icons.my_location, size: 18),
                label: Text(_position == null ? 'Coba ambil lokasi lagi' : 'Perbarui lokasi'),
              ),
          ],
          FilledButton.icon(
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(46)),
            onPressed: widget.busy || (_needsGps && _position == null) ? null : () => widget.onCheckIn(_needsGps ? _position! : {}),
            icon: const Icon(Icons.login),
            label: const Text('Absen masuk & mulai sesi'),
          ),
          if (t['type'] != 'ONLINE') ...[
            const Divider(height: 20),
            if (request != null)
              Row(children: [
                Expanded(
                  child: Text('Lokasi sementara "${text(request['location_name'])}"'
                      ' (${request['requester_type'] == 'PARENT' ? 'orang tua' : 'Anda'})'
                      '${request['review_note'] != null ? ' • ${request['review_note']}' : ''}',
                      style: const TextStyle(fontSize: 12)),
                ),
                StatusChip(request['status']),
              ]),
            Wrap(alignment: WrapAlignment.end, spacing: 8, children: [
              if (request?['status'] == 'PENDING' && request['requester_type'] == 'TENTOR')
                TextButton(
                  onPressed: () => _cancelRequest('${request['id']}'),
                  style: TextButton.styleFrom(foregroundColor: Colors.red),
                  child: const Text('Batalkan pengajuan'),
                ),
              if (widget.session['can_request_location'] == true && request?['status'] != 'PENDING')
                TextButton.icon(
                  onPressed: _requestLocation,
                  icon: const Icon(Icons.edit_location_alt_outlined, size: 18),
                  label: const Text('Ajukan lokasi sementara'),
                ),
              TextButton.icon(
                onPressed: _requestReschedule,
                icon: const Icon(Icons.edit_calendar_outlined, size: 18),
                label: const Text('Ajukan pindah jadwal'),
              ),
            ]),
          ],
          // Kelas online tidak punya pengajuan lokasi, tetapi tetap bisa pindah jadwal
          if (t['type'] == 'ONLINE')
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: _requestReschedule,
                icon: const Icon(Icons.edit_calendar_outlined, size: 18),
                label: const Text('Ajukan pindah jadwal'),
              ),
            ),
        ]),
      ),
    );
  }
}
