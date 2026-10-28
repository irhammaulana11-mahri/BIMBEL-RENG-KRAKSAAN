import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../api/api_client.dart';
import 'common.dart';

/// Ikon lonceng di app bar semua portal, dengan jumlah notifikasi belum dibaca (diperbarui tiap 60 detik).
class NotificationBellButton extends StatefulWidget {
  const NotificationBellButton({super.key});

  @override
  State<NotificationBellButton> createState() => _NotificationBellButtonState();
}

class _NotificationBellButtonState extends State<NotificationBellButton> {
  int _unread = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _refresh();
    _timer = Timer.periodic(const Duration(seconds: 60), (_) => _refresh());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _refresh() async {
    try {
      final res = await api.get('/notifications');
      if (mounted) setState(() => _unread = (res['unread'] ?? 0) as int);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: 'Notifikasi',
      onPressed: () async {
        await Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen()));
        _refresh();
      },
      icon: Badge(
        isLabelVisible: _unread > 0,
        label: Text(_unread > 9 ? '9+' : '$_unread'),
        child: const Icon(Icons.notifications_outlined),
      ),
    );
  }
}

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _key = GlobalKey<AsyncViewState>();

  static const _kinds = {
    'registration_approved': (Icons.how_to_reg, Colors.green),
    'registration_rejected': (Icons.person_off_outlined, Colors.red),
  };

  Future<void> _read(Map n) async {
    if (n['read'] == true) return;
    try {
      await api.patch('/notifications/${n['id']}/read');
      await _key.currentState?.reload();
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifikasi'), actions: [
        TextButton(
          onPressed: () async {
            await api.patch('/notifications/read-all');
            await _key.currentState?.reload();
          },
          child: const Text('Tandai dibaca'),
        ),
      ]),
      body: AsyncView<Map>(
        key: _key,
        load: () async => await api.get('/notifications'),
        builder: (context, res, _) {
          final items = res['data'] as List? ?? [];
          return ListView(padding: const EdgeInsets.all(12), children: [
            if (items.isEmpty) const EmptyState('Belum ada notifikasi.', icon: Icons.notifications_none),
            for (final n in items)
              Card(
                color: n['read'] == true ? null : Theme.of(context).colorScheme.primaryContainer.withValues(alpha: .35),
                child: InkWell(
                  onTap: () => _read(n),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      CircleAvatar(
                        backgroundColor: (_kinds[n['kind']]?.$2 ?? Colors.blue).withValues(alpha: .15),
                        child: Icon(_kinds[n['kind']]?.$1 ?? Icons.info_outline, color: _kinds[n['kind']]?.$2 ?? Colors.blue),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(text(n['title']), style: TextStyle(fontWeight: n['read'] == true ? FontWeight.w600 : FontWeight.w800)),
                          const SizedBox(height: 2),
                          Text(text(n['message'], ''), style: const TextStyle(fontSize: 13)),
                          // Rincian (mis. email & password sementara akun anak) bisa disalin
                          for (final e in (n['details'] as Map? ?? {}).entries)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Row(children: [
                                Text('${e.key}: ', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                Expanded(child: SelectableText('${e.value}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, fontFamily: 'monospace'))),
                                IconButton(
                                  visualDensity: VisualDensity.compact,
                                  icon: const Icon(Icons.copy, size: 16),
                                  onPressed: () {
                                    Clipboard.setData(ClipboardData(text: '${e.value}'));
                                    showSnack(context, '${e.key} disalin.');
                                  },
                                ),
                              ]),
                            ),
                          const SizedBox(height: 4),
                          Text(text(n['created_at']), style: const TextStyle(fontSize: 11, color: Colors.grey)),
                        ]),
                      ),
                    ]),
                  ),
                ),
              ),
          ]);
        },
      ),
    );
  }
}
