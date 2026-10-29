@extends('pdf.layout')
@section('title', 'Laporan Persetujuan Sendiri ' . $report['period'])
@section('content')
  <p class="doc-title">LAPORAN PERSETUJUAN ATAS PEKERJAAN SENDIRI</p>
  <p class="muted" style="margin:0">Periode {{ $report['period'] }} • Mode persetujuan: {{ $report['mode'] === 'separated' ? 'terpisah' : 'operator tunggal' }}</p>

  <div class="box">
    {{ $report['summary']['self_approved'] }} aksi keuangan disetujui oleh akun yang juga mengerjakan tahap sebelumnya.
    {{ $report['summary']['transfers'] }} transfer honor: {{ $report['summary']['unconfirmed'] }} belum dikonfirmasi tentor,
    {{ $report['summary']['disputed'] }} dilaporkan bermasalah.
  </div>

  <p style="margin:16px 0 0"><b>Aksi yang disetujui sendiri</b></p>
  <table class="grid">
    <thead><tr><th>Waktu (WIB)</th><th>Jenis</th><th>Referensi</th><th class="right">Nominal</th><th>Oleh</th><th>Alasan</th></tr></thead>
    <tbody>
      @forelse($report['actions'] as $a)
        <tr><td>{{ $a['time'] }}</td><td>{{ $a['type'] }}</td><td>{{ $a['reference'] }}</td>
            <td class="right">{{ $a['amount'] > 0 ? \App\Support\Pdf::rupiah($a['amount']) : '-' }}</td>
            <td>{{ $a['actor'] }}</td><td class="muted">{{ $a['reason'] ?: '-' }}</td></tr>
      @empty
        <tr><td colspan="6" class="muted">Tidak ada aksi yang disetujui sendiri pada periode ini.</td></tr>
      @endforelse
    </tbody>
  </table>

  <p style="margin:16px 0 0"><b>Transfer honor & konfirmasi tentor</b></p>
  <table class="grid">
    <thead><tr><th>Tanggal</th><th>Tentor</th><th>Payroll</th><th>No. Referensi</th><th class="right">Nominal</th><th>Konfirmasi tentor</th></tr></thead>
    <tbody>
      @forelse($report['transfers'] as $t)
        <tr><td>{{ $t['date'] }}</td><td>{{ $t['tentor'] }}</td><td>{{ $t['payroll_no'] }}</td><td>{{ $t['reference_no'] ?: '-' }}</td>
            <td class="right">{{ \App\Support\Pdf::rupiah($t['amount']) }}</td>
            <td>{{ ['RECEIVED' => 'Diterima', 'DISPUTED' => 'Bermasalah'][$t['receipt_status']] ?? 'Belum dikonfirmasi' }}{{ $t['receipt_note'] ? ' — ' . $t['receipt_note'] : '' }}</td></tr>
      @empty
        <tr><td colspan="6" class="muted">Tidak ada transfer honor pada periode ini.</td></tr>
      @endforelse
    </tbody>
  </table>

  <div class="box muted">Laporan ini arsip dan alat tinjau-diri. Persetujuan oleh pengelola yang sama terdeteksi dan tercatat,
    tetapi tidak dicegah oleh sistem. Konfirmasi tentor adalah verifikasi dari pihak di luar pengelola.</div>
@endsection
