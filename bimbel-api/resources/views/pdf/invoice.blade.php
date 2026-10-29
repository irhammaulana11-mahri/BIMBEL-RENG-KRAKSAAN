@extends('pdf.layout')
@section('title', 'Invoice ' . $invoice->invoice_no)
@section('content')
  @php($status = ['UNPAID' => ['Belum dibayar', 'b-amber'], 'PARTIAL' => ['Dibayar sebagian', 'b-blue'], 'PAID' => ['Lunas', 'b-green'], 'CANCELLED' => ['Dibatalkan', 'b-red']][$invoice->status] ?? [$invoice->status, 'b-blue'])
  <table style="width:100%"><tr>
    <td><p class="doc-title">INVOICE / TAGIHAN</p><p class="muted" style="margin:0">No. {{ $invoice->invoice_no }}</p></td>
    <td class="right"><span class="badge {{ $status[1] }}" style="font-size:11px">{{ $status[0] }}</span></td>
  </tr></table>

  <table class="meta">
    <tr><td class="label">Siswa</td><td><b>{{ $invoice->student?->full_name }}</b> ({{ $invoice->student?->nis }})</td>
        <td class="label">Tanggal terbit</td><td>{{ $invoice->issue_date?->locale('id')->translatedFormat('d F Y') }}</td></tr>
    <tr><td class="label">Orang tua / wali</td><td>{{ $invoice->student?->parents?->first()?->full_name ?? '-' }}</td>
        <td class="label">Jatuh tempo</td><td><b>{{ $invoice->due_date?->locale('id')->translatedFormat('d F Y') }}</b></td></tr>
    <tr><td class="label">Kelas</td><td>{{ $invoice->classroom?->name ?? '-' }}</td>
        <td class="label">Periode</td><td>{{ $invoice->period_month ? \Carbon\Carbon::create($invoice->period_year, $invoice->period_month, 1)->locale('id')->translatedFormat('F Y') : '-' }}</td></tr>
  </table>

  <table class="grid">
    <thead><tr><th>No</th><th>Rincian</th><th class="right">Qty</th><th class="right">Harga</th><th class="right">Diskon</th><th class="right">Subtotal</th></tr></thead>
    <tbody>
      @foreach($invoice->items as $i => $item)
        <tr>
          <td>{{ $i + 1 }}</td>
          <td><b>{{ $item->item_name }}</b>@if($item->description)<br><span class="muted">{{ $item->description }}</span>@endif</td>
          <td class="right">{{ rtrim(rtrim(number_format((float) $item->quantity, 2, ',', '.'), '0'), ',') }}</td>
          <td class="right">{{ \App\Support\Pdf::rupiah($item->unit_price) }}</td>
          <td class="right">{{ (float) $item->discount > 0 ? \App\Support\Pdf::rupiah($item->discount) : '-' }}</td>
          <td class="right">{{ \App\Support\Pdf::rupiah($item->subtotal) }}</td>
        </tr>
      @endforeach
      @if((float) $invoice->discount > 0)
        <tr><td colspan="5" class="right">Diskon tagihan</td><td class="right">- {{ \App\Support\Pdf::rupiah($invoice->discount) }}</td></tr>
      @endif
      <tr class="total-row"><td colspan="5" class="right">TOTAL TAGIHAN</td><td class="right">{{ \App\Support\Pdf::rupiah($invoice->total_amount) }}</td></tr>
      <tr><td colspan="5" class="right">Sudah dibayar</td><td class="right">{{ \App\Support\Pdf::rupiah($invoice->paid_amount) }}</td></tr>
      <tr class="total-row"><td colspan="5" class="right">SISA TAGIHAN</td><td class="right">{{ \App\Support\Pdf::rupiah($invoice->remaining_amount) }}</td></tr>
    </tbody>
  </table>

  {{-- Pembayaran yang dibatalkan lewat reversal tidak dihitung sebagai diterima --}}
  @php($payments = $invoice->paymentDetails->filter(fn($d) => $d->payment && $d->payment->status === 'CONFIRMED' && !$d->payment->approvedReversal))
  @if($payments->isNotEmpty())
    <p style="margin:16px 0 0"><b>Riwayat pembayaran diterima</b></p>
    <table class="grid">
      <thead><tr><th>No. Bayar</th><th>Tanggal</th><th>Metode</th><th class="right">Jumlah</th></tr></thead>
      <tbody>
        @foreach($payments as $d)
          <tr><td>{{ $d->payment->payment_no }}</td><td>{{ $d->payment->payment_date?->locale('id')->translatedFormat('d M Y') }}</td>
              <td>{{ $d->payment->payment_method === 'CASH' ? 'Tunai' : 'Transfer' }}{{ $d->payment->payment_channel ? ' • ' . $d->payment->payment_channel : '' }}</td>
              <td class="right">{{ \App\Support\Pdf::rupiah($d->amount_paid) }}</td></tr>
        @endforeach
      </tbody>
    </table>
  @endif

  @if($invoice->status !== 'PAID' && $invoice->status !== 'CANCELLED')
    <div class="box">Pembayaran dapat dilakukan tunai di kantor bimbel atau transfer, lalu unggah bukti transfer di menu Tagihan pada aplikasi / web portal orang tua.</div>
  @endif
@endsection
