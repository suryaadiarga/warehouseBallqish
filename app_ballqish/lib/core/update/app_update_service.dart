import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:open_filex/open_filex.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path_provider/path_provider.dart';

import '../config/api_config.dart';

class AppUpdateInfo {
  const AppUpdateInfo({
    required this.versionName,
    required this.versionCode,
    required this.minimumVersionCode,
    required this.downloadUrl,
    required this.releaseNotes,
    this.sha256,
  });

  final String versionName;
  final int versionCode;
  final int minimumVersionCode;
  final String downloadUrl;
  final String releaseNotes;
  final String? sha256;

  bool isRequiredFor(int installedVersionCode) =>
      installedVersionCode < minimumVersionCode;
}

class AppUpdateService {
  AppUpdateService({http.Client? httpClient})
    : _httpClient = httpClient ?? http.Client();

  final http.Client _httpClient;

  Future<AppUpdateInfo?> check() async {
    if (!Platform.isAndroid) return null;

    final response = await _httpClient
        .get(
          Uri.parse('${ApiConfig.baseUrl}/mobile/version'),
          headers: {'Accept': 'application/json'},
        )
        .timeout(const Duration(seconds: 15));

    if (response.statusCode != 200) return null;

    final payload = jsonDecode(response.body) as Map<String, dynamic>;
    final data = payload['data'] as Map<String, dynamic>;
    final installed = await PackageInfo.fromPlatform();
    final installedCode = int.tryParse(installed.buildNumber) ?? 0;
    final latestCode = (data['version_code'] as num).toInt();

    if (latestCode <= installedCode) return null;

    return AppUpdateInfo(
      versionName: data['version_name'].toString(),
      versionCode: latestCode,
      minimumVersionCode: (data['minimum_version_code'] as num).toInt(),
      downloadUrl: data['download_url'].toString(),
      sha256: data['sha256']?.toString(),
      releaseNotes: data['release_notes']?.toString() ?? '',
    );
  }

  Future<void> downloadAndInstall(
    AppUpdateInfo update, {
    required ValueChanged<double> onProgress,
  }) async {
    final request = http.Request('GET', Uri.parse(update.downloadUrl));
    final response = await _httpClient.send(request);

    if (response.statusCode != 200) {
      throw Exception('APK gagal diunduh (${response.statusCode}).');
    }

    final directory = await getTemporaryDirectory();
    final file = File('${directory.path}/ballqish-${update.versionCode}.apk');
    final sink = file.openWrite();
    final bytes = <int>[];
    var received = 0;
    final total = response.contentLength ?? 0;

    await for (final chunk in response.stream) {
      sink.add(chunk);
      bytes.addAll(chunk);
      received += chunk.length;
      onProgress(total > 0 ? received / total : 0);
    }
    await sink.close();

    final expectedHash = update.sha256?.toLowerCase().trim();
    if (expectedHash != null &&
        expectedHash.isNotEmpty &&
        sha256.convert(bytes).toString() != expectedHash) {
      await file.delete();
      throw Exception('Checksum APK tidak cocok. Pembaruan dibatalkan.');
    }

    final result = await OpenFilex.open(
      file.path,
      type: 'application/vnd.android.package-archive',
    );
    if (result.type != ResultType.done) {
      throw Exception(result.message);
    }
  }

  Future<void> checkAndPrompt(
    BuildContext context, {
    bool showUpToDateMessage = false,
  }) async {
    if (!Platform.isAndroid || !context.mounted) return;

    try {
      final update = await check();
      if (!context.mounted) return;

      if (update == null) {
        if (showUpToDateMessage) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Aplikasi sudah versi terbaru.')),
          );
        }
        return;
      }

      final installed = await PackageInfo.fromPlatform();
      if (!context.mounted) return;

      final installedCode = int.tryParse(installed.buildNumber) ?? 0;
      final required = update.isRequiredFor(installedCode);
      var progress = 0.0;
      var downloading = false;

      await showDialog<void>(
        context: context,
        barrierDismissible: !required,
        builder: (dialogContext) => StatefulBuilder(
          builder: (context, setState) => AlertDialog(
            title: Text('Pembaruan ${update.versionName} tersedia'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (update.releaseNotes.isNotEmpty) Text(update.releaseNotes),
                if (downloading) ...[
                  const SizedBox(height: 20),
                  LinearProgressIndicator(
                    value: progress > 0 ? progress : null,
                  ),
                  const SizedBox(height: 8),
                  Text('${(progress * 100).round()}%'),
                ],
              ],
            ),
            actions: [
              if (!required && !downloading)
                TextButton(
                  onPressed: () => Navigator.pop(dialogContext),
                  child: const Text('Nanti'),
                ),
              FilledButton(
                onPressed: downloading
                    ? null
                    : () async {
                        setState(() => downloading = true);
                        try {
                          await downloadAndInstall(
                            update,
                            onProgress: (value) {
                              if (dialogContext.mounted) {
                                setState(() => progress = value);
                              }
                            },
                          );
                          if (dialogContext.mounted) {
                            Navigator.pop(dialogContext);
                          }
                        } catch (error) {
                          if (!dialogContext.mounted) return;
                          setState(() => downloading = false);
                          ScaffoldMessenger.of(dialogContext).showSnackBar(
                            SnackBar(content: Text(error.toString())),
                          );
                        }
                      },
                child: const Text('Perbarui'),
              ),
            ],
          ),
        ),
      );
    } catch (error) {
      if (kDebugMode) {
        debugPrint('Pemeriksaan pembaruan gagal: $error');
      }
      if (showUpToDateMessage && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Tidak dapat memeriksa pembaruan saat ini.'),
          ),
        );
      }
    }
  }
}
