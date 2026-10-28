@extends('pdf.layout')
@section('title', 'Slip Honor ' . $row['tentor_name'] . ' ' . $period)
@section('content')
  <p class="doc-title">SLIP HONOR TENTOR</p>
  <p class="muted" style="margin:0">Periode {{ $period }} • No. {{ $payroll->payroll_no }}</p>

  <table class="meta">
    <tr><td class="label">Nama Tentor</td><td><b>{{ $row['tentor_name'] }}</b></td>
        <td class="label">Status</td><td>
          @php($st = ['DRAFT' => ['Draf', 'b-amber'], 'APPROVED' => ['Disetujui', 'b-blue'], 'PAID' => ['Dibayar', 'b-green']][$payroll->status] ?? [$payroll->status, 'b-blue'])
          <span class="badge {{ $st[1] }}">{{ $row['transfer'] ? 'Ditransfer' : $st[0] }}</span></td></tr>
    <tr><td class="label">Spesialisasi</td><td>{{ $row['specialization'] ?: '-' }}</td>
        <td class="label">Jumlah sesi</td><td>{{ $row['total_sessions'] }} sesi • {{ round($row['teaching_minutes'] / 60, 1) }} jam</td></tr>
    <tr><td class="label">Perhitungan</td><td colspan="3">{{ $row['calc_summary'] ?: '-' }}</td></tr>
  </table>

  <table class="grid">
    <thead><tr><th>No</th><th>Tanggal</th><th>Kelas & Mapel</th><th>Perhitungan</th><th class="right">Menit</th><th class="right">Honor</th></tr></thead>
    <tbody>
      @foreach($row['sessions'] as $i => $s)
        <tr>
          <td>{{ $i + 1 }}</td>
          <td>{{ $s['session_date'] ? \Carbon\Carbon::parse($s['session_date'])->locale('id')->translatedFormat('d M Y') . ' ' . $s['start_time'] : 'Bulanan' }}</td>
          <td>{{ $s['class_name'] }} • {{ $s['subject_name'] }}</td>
          <td class="muted">{{ $s['note'] ?: '-' }}@if(($s['unit_amount'] ?? 0) > 0) ({{ rtrim(rtrim(number_format($s['quantity'], 2, ',', '.'), '0'), ',') }} × {{ \App\Support\Pdf::rupiah($s['unit_amount']) }})@endif</td>
          <td class="right">{{ $s['teaching_minutes'] }}</td>
          <td class="right">{{ \App\Support\Pdf::rupiah($s['subtotal']) }}</td>
        </tr>
      @endforeach
      <tr class="total-row"><td colspan="5" class="right">TOTAL HONOR</td><td class="right">{{ \App\Support\Pdf::rupiah($row['total_amount']) }}</td></tr>
    </tbody>
  </table>

  @if($row['transfer'])
    <div class="box">
      <b>Bukti transfer</b><br>
      Tanggal {{ \Carbon\Carbon::parse($row['transfer']['transfer_date'])->locale('id')->translatedFormat('d F Y') }}
      • Sejumlah {{ \App\Support\Pdf::rupiah($row['transfer']['amount']) }}
      @if($row['transfer']['source_account']) • Rekening sumber {{ $row['transfer']['source_account'] }}@endif
      @if($row['transfer']['reference_no']) • Ref. {{ $row['transfer']['reference_no'] }}@endif
    </div>
  @else
    <div class="box muted">Honor belum ditransfer. Slip ini bersifat sementara sampai pembayaran dicatat Admin.</div>
  @endif

  <table class="sign"><tr>
    <td>Penerima,<br><br><br><br><b>{{ $row['tentor_name'] }}</b></td>
    <td>Kraksaan, {{ now('Asia/Jakarta')->locale('id')->translatedFormat('d F Y') }}<br>Bagian Keuangan,<br><br><br><b>{{ $company['name'] }}</b></td>
  </tr></table>
@endsection
