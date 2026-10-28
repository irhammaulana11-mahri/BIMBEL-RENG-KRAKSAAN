import 'package:flutter/material.dart';

import '../auth/auth_state.dart';
import 'notifications.dart';

class PortalTab {
  final String label;
  final IconData icon;
  final Widget body;
  const PortalTab(this.label, this.icon, this.body);
}

/// Kerangka portal: app bar + navigasi bawah. Tab yang sudah dibuka tetap tersimpan.
class PortalShell extends StatefulWidget {
  final String portalName;
  final List<PortalTab> tabs;
  const PortalShell({super.key, required this.portalName, required this.tabs});

  @override
  State<PortalShell> createState() => _PortalShellState();
}

class _PortalShellState extends State<PortalShell> {
  int _index = 0;
  final _visited = <int>{0};

  Future<void> _confirmLogout() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Keluar'),
        content: const Text('Keluar dari akun ini?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Keluar')),
        ],
      ),
    );
    if (ok == true) await auth.logout();
  }

  @override
  Widget build(BuildContext context) {
    final tab = widget.tabs[_index];
    return Scaffold(
      appBar: AppBar(
        foregroundColor: Colors.white,
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(colors: [Color(0xFF4338CA), Color(0xFF2563EB)], begin: Alignment.centerLeft, end: Alignment.centerRight),
          ),
        ),
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(tab.label, style: const TextStyle(fontWeight: FontWeight.w700)),
          Text('${widget.portalName} • ${auth.name}', style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: .8))),
        ]),
        actions: [
          const NotificationBellButton(),
          IconButton(tooltip: 'Keluar', onPressed: _confirmLogout, icon: const Icon(Icons.logout)),
        ],
      ),
      body: IndexedStack(
        index: _index,
        children: [
          for (var i = 0; i < widget.tabs.length; i++) _visited.contains(i) ? widget.tabs[i].body : const SizedBox(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() {
          _index = i;
          _visited.add(i);
        }),
        destinations: [for (final t in widget.tabs) NavigationDestination(icon: Icon(t.icon), label: t.label)],
      ),
    );
  }
}
