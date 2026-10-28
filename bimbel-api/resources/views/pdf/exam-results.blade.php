@extends('pdf.layout')
@section('title', 'Rekap Evaluasi Murid')
@section('content')
  <p class="doc-title">REKAP EVALUASI MURID</p>
  <p class="muted" style="margin:0">Tentor {{ $tentorName }} • {{ $filterLabel }}</p>

  <table class="meta">
    <tr><td class="label">Jumlah hasil</td><td><b>{{ $summary['total'] }}</b></td>
        <td class="label">Rata-rata nilai</td><td><b>{{ $summary['average'] ?? '-' }}</b> (dari hasil yang sudah dinilai)</td></tr>
    <tr><td class="label">Sudah dinilai</td><td>{{ $summary['graded'] }}</td>
        <td class="label">Perlu dinilai</td><td>{{ $summary['pending'] }}</td></tr>
  </table>

  <table class="grid">
    <thead><tr><th>No</th><th>Siswa</th><th>Ujian</th><th>Mapel</th><th>Dikumpulkan</th><th class="center">B / S / K</th><th class="right">Nilai</th><th class="center">Status</th></tr></thead>
    <tbody>
      @forelse($results as $i => $r)
        <tr>
          <td>{{ $i + 1 }}</td>
          <td>{{ $r->student?->full_name }}</td>
          <td>{{ $r->exam?->title }}</td>
          <td>{{ $r->exam?->subject?->name }}</td>
          <td>{{ $r->submitted_at ? $r->submitted_at->copy()->setTimezone('Asia/Jakarta')->format('d/m/Y H:i') : '-' }}</td>
          <td class="center">{{ $r->total_correct ?? 0 }} / {{ $r->total_wrong ?? 0 }} / {{ $r->total_unanswered ?? 0 }}</td>
          <td class="right"><b>{{ $r->status === 'GRADED' ? rtrim(rtrim(number_format((float) $r->score, 2, ',', '.'), '0'), ',') : '-' }}</b></td>
          <td class="center"><span class="badge {{ $r->status === 'GRADED' ? 'b-green' : 'b-amber' }}">{{ $r->status === 'GRADED' ? 'Dinilai' : 'Perlu dinilai' }}</span></td>
        </tr>
      @empty
        <tr><td colspan="8" class="center muted">Tidak ada hasil ujian.</td></tr>
      @endforelse
    </tbody>
  </table>
@endsection
