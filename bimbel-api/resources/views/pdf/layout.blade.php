<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>@yield('title')</title>
<style>
  @page { margin: 28px 34px; }
  body { font-family: DejaVu Sans, sans-serif; font-size: 10.5px; color: #1f2937; }
  .kop { width: 100%; border-bottom: 3px solid #4338ca; padding-bottom: 10px; margin-bottom: 16px; }
  .kop td { vertical-align: middle; }
  .kop .name { font-size: 17px; font-weight: bold; color: #312e81; }
  .kop .sub { font-size: 9.5px; color: #6b7280; }
  .doc-title { font-size: 15px; font-weight: bold; color: #111827; margin: 0 0 2px; }
  .muted { color: #6b7280; }
  .meta { width: 100%; margin: 10px 0 14px; }
  .meta td { padding: 2px 0; vertical-align: top; }
  .meta .label { color: #6b7280; width: 110px; }
  table.grid { width: 100%; border-collapse: collapse; margin-top: 6px; }
  table.grid th { background: #eef2ff; color: #3730a3; font-size: 9px; text-transform: uppercase; letter-spacing: .4px; text-align: left; padding: 7px 8px; border-bottom: 1px solid #c7d2fe; }
  table.grid td { padding: 6px 8px; border-bottom: 1px solid #eef0f4; }
  table.grid tr:nth-child(even) td { background: #fafbff; }
  .right { text-align: right; }
  .center { text-align: center; }
  .total-row td { font-weight: bold; background: #f5f3ff !important; border-top: 2px solid #c7d2fe; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: bold; }
  .b-green { background: #dcfce7; color: #166534; } .b-amber { background: #fef3c7; color: #92400e; }
  .b-red { background: #fee2e2; color: #991b1b; } .b-blue { background: #dbeafe; color: #1e40af; }
  .box { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 12px; margin-top: 14px; }
  .sign { width: 100%; margin-top: 34px; }
  .sign td { width: 50%; text-align: center; vertical-align: top; }
  .footer { position: fixed; bottom: -10px; left: 0; right: 0; font-size: 8.5px; color: #9ca3af; text-align: center; }
</style>
</head>
<body>
  <table class="kop"><tr>
    @if($company['logo'])<td style="width:58px"><img src="{{ $company['logo'] }}" style="height:46px"></td>@endif
    <td>
      <div class="name">{{ $company['name'] }}</div>
      @if($company['address'])<div class="sub">{{ $company['address'] }}</div>@endif
      @if($company['contact'])<div class="sub">{{ $company['contact'] }}</div>@endif
    </td>
  </tr></table>

  @yield('content')

  <div class="footer">Dokumen dibuat otomatis oleh sistem {{ $company['name'] }} pada {{ now('Asia/Jakarta')->locale('id')->translatedFormat('d F Y H:i') }} WIB</div>
</body>
</html>
