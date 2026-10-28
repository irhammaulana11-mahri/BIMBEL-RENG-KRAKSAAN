import 'dart:io';

import 'package:flutter/material.dart';
import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';

import '../api/api_client.dart';
import 'common.dart';

const _extensions = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/msword': 'doc',
  'application/vnd.ms-powerpoint': 'ppt',
};

/// Unduh berkas privat dari API (dengan token) lalu buka di aplikasi bawaan HP.
Future<void> openPrivateFile(BuildContext context, String apiPath, String name) async {
  showSnack(context, 'Mengunduh $name...');
  try {
    final res = await api.download(apiPath);
    final type = (res.headers['content-type'] ?? '').split(';').first.trim();
    final ext = _extensions[type] ?? 'bin';
    final safeName = name.replaceAll(RegExp(r'[^\w\- ]'), '_');
    final file = File('${(await getTemporaryDirectory()).path}/$safeName.$ext');
    await file.writeAsBytes(res.bodyBytes);
    final result = await OpenFilex.open(file.path);
    if (result.type != ResultType.done && context.mounted) {
      showSnack(context, 'Tidak ada aplikasi untuk membuka berkas ini.', error: true);
    }
  } catch (e) {
    if (context.mounted) showSnack(context, '$e', error: true);
  }
}
