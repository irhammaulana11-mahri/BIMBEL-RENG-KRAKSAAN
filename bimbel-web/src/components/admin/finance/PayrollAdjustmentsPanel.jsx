import { useEffect, useState } from "react";
import { getPayrollAdjustments, settlePayrollAdjustment, convertPayrollAdjustment } from "@/services/finance/financeService";
import { getApiErrorMessage } from "@/utils/apiError";
import { formatRupiah } from "@/utils/format";

const KIND = {
  ADDITION: { label: "Penambah honor", className: "bg-emerald-50 text-emerald-700" },
  DEDUCTION: { label: "Potongan honor", className: "bg-rose-50 text-rose-700" },
  RECOVERY: { label: "Minta pengembalian", className: "bg-amber-50 text-amber-700" },
};

/**
 * Penyesuaian honor dari koreksi absensi. Penambah & potongan otomatis masuk payroll berikutnya yang disusun;
 * permintaan pengembalian dicatat selesai saat dana diterima, atau diubah menjadi potongan.
 */
export default function PayrollAdjustmentsPanel({ refreshKey, onNotify, onChanged }) {
  const [rows, setRows] = useState([]);
  const [action, setAction] = useState(null); // { row, type: settle|convert, text }

  const load = () => getPayrollAdjustments({ status: "OPEN" })
    .then(res => setRows(res.data.data || []))
    .catch(err => onNotify(getApiErrorMessage(err, "Gagal memuat penyesuaian honor."), "error"));

  useEffect(() => { load(); }, [refreshKey]);

  if (rows.length === 0) return null;

  const submit = async () => {
    try {
      const res = action.type === "settle"
        ? await settlePayrollAdjustment(action.row.id, { reference: action.text })
        : await convertPayrollAdjustment(action.row.id, { note: action.text });
      onNotify(res.data.message);
      setAction(null);
      load();
      onChanged?.();
    } catch (err) {
      onNotify(getApiErrorMessage(err, "Gagal menyimpan."), "error");
    }
  };

  return (
    <div className="border border-gray-200 rounded-2xl">
      <p className="px-4 py-3 font-bold text-gray-900 border-b border-gray-100">Penyesuaian honor dari koreksi absensi</p>
      <div className="divide-y divide-gray-100">
        {rows.map(a => (
          <div key={a.id} className="p-4 flex flex-wrap items-center gap-3 text-sm">
            <div className="flex-1 min-w-[220px]">
              <p className="font-bold text-gray-900">{a.tentor_name}</p>
              <p className="text-xs text-gray-500">{a.note}</p>
            </div>
            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${KIND[a.kind]?.className}`}>{KIND[a.kind]?.label}</span>
            <span className="font-black">{formatRupiah(a.remaining_amount)}{a.remaining_amount < a.amount ? ` / ${formatRupiah(a.amount)}` : ""}</span>
            {a.kind === "RECOVERY" && (action?.row.id === a.id ? (
              <span className="flex gap-2 w-full sm:w-auto">
                <input autoFocus value={action.text} onChange={e => setAction({ ...action, text: e.target.value })} placeholder={action.type === "settle" ? "Referensi penerimaan" : "Alasan diubah jadi potongan"} className="rounded-xl border px-3 py-1.5 text-xs flex-1" />
                <button onClick={submit} disabled={action.text.trim().length < (action.type === "settle" ? 1 : 5)} className="px-3 py-1.5 rounded-lg bg-gray-800 text-white text-xs font-bold disabled:opacity-40">Simpan</button>
                <button onClick={() => setAction(null)} className="text-xs text-gray-500">Batal</button>
              </span>
            ) : (
              <span className="flex gap-2">
                <button onClick={() => setAction({ row: a, type: "settle", text: "" })} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white">Dana diterima</button>
                <button onClick={() => setAction({ row: a, type: "convert", text: "" })} className="px-3 py-1.5 rounded-lg text-xs font-bold border">Jadikan potongan</button>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
