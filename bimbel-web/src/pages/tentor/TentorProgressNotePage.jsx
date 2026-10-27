import React, { useEffect, useState } from "react";
import { Save, Lock, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import { getTentorProgressNotes, saveTentorProgressNotes, formatScore } from "@/services/academic/progressReportService";
import { getApiErrorMessage } from "@/utils/apiError";
import { currentPeriod } from "@/utils/format";

const groupKey = (g) => `${g.class_id}|${g.subject_id}`;

export default function TentorProgressNotePage() {
  const [period, setPeriod] = useState(currentPeriod());
  const [groups, setGroups] = useState([]);
  const [periodLabel, setPeriodLabel] = useState("");
  const [drafts, setDrafts] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast, showSuccess, showError, hideToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await getTentorProgressNotes(period);
      const data = res.data.data || [];
      setGroups(data);
      setPeriodLabel(res.data.period?.label || "");
      // Draft teks per kelas-mapel per siswa
      setDrafts(Object.fromEntries(data.map((g) => [groupKey(g), Object.fromEntries(g.students.map((s) => [s.student_id, s.note || ""]))])));
      setExpanded((current) => current ?? (data[0] ? groupKey(data[0]) : null));
    } catch (err) {
      showError(getApiErrorMessage(err, "Gagal memuat data perkembangan."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [period]);

  const changedStudents = (group) => group.students.filter((s) => !s.locked && (s.note || "") !== (drafts[groupKey(group)]?.[s.student_id] ?? ""));

  const handleSave = async (group) => {
    const changed = changedStudents(group);
    if (changed.length === 0) return;
    setSaving(groupKey(group));
    try {
      const res = await saveTentorProgressNotes({
        period,
        class_id: group.class_id,
        subject_id: group.subject_id,
        notes: changed.map((s) => ({ student_id: s.student_id, note: drafts[groupKey(group)][s.student_id] })),
      });
      showSuccess(res.data.message);
      load();
    } catch (err) {
      showError(getApiErrorMessage(err, "Gagal menyimpan catatan."));
    } finally {
      setSaving(null);
    }
  };

  const setDraft = (group, studentId, value) =>
    setDrafts((prev) => ({ ...prev, [groupKey(group)]: { ...prev[groupKey(group)], [studentId]: value } }));

  return (
    <div className="space-y-6 animate-in fade-in">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Perkembangan Nilai</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tulis catatan perkembangan tiap siswa di mapel yang Anda ajar. Catatan masuk ke rapor bulanan yang diterbitkan Admin.</p>
        </div>
        <input type="month" value={period} onChange={(e) => e.target.value && setPeriod(e.target.value)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white font-semibold text-gray-700" />
      </div>

      {loading ? (
        <p className="p-12 text-center text-sm font-bold text-gray-400">Memuat...</p>
      ) : groups.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-sm text-gray-400">Tidak ada kelas atau mapel yang Anda ajar pada {periodLabel || "periode ini"}.</div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const key = groupKey(group);
            const isOpen = expanded === key;
            const changed = changedStudents(group).length;
            return (
              <div key={key} className="bg-white border border-gray-200 rounded-2xl">
                <button onClick={() => setExpanded(isOpen ? null : key)} className="w-full text-left p-4 flex flex-wrap items-center gap-3 hover:bg-slate-50 rounded-2xl">
                  {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><BookOpen size={18} /></div>
                  <div className="flex-1 min-w-[160px]">
                    <p className="font-bold text-gray-900">{group.subject_name}</p>
                    <p className="text-xs text-gray-400">{group.class_name} • {group.students.length} siswa</p>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${group.notes_filled >= group.students.length && group.students.length > 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {group.notes_filled}/{group.students.length} catatan
                  </span>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-3">
                    {group.students.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Belum ada siswa di kelas ini.</p>}
                    {group.students.map((s) => (
                      <div key={s.student_id} className="border border-gray-100 rounded-xl p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <p className="font-semibold text-gray-900">{s.student_name}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>Hadir <b className="text-gray-900">{s.hadir}/{s.held_sessions}</b></span>
                            <span>Nilai <b className="text-gray-900">{formatScore(s.exam_average)}</b> ({s.exam_count} ujian)</span>
                            {s.locked && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-bold flex items-center gap-1"><Lock size={11} /> Rapor terbit</span>}
                          </div>
                        </div>
                        <textarea
                          rows={2}
                          maxLength={2000}
                          disabled={s.locked}
                          value={drafts[key]?.[s.student_id] ?? ""}
                          onChange={(e) => setDraft(group, s.student_id, e.target.value)}
                          placeholder="Contoh: Sudah paham konsep pecahan, perlu latihan soal cerita."
                          className="w-full rounded-xl border px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                        />
                        {s.note_by && <p className="text-[11px] text-gray-400 mt-1">Ditulis oleh {s.note_by}</p>}
                      </div>
                    ))}
                    {group.students.length > 0 && (
                      <div className="flex justify-end">
                        <button onClick={() => handleSave(group)} disabled={changed === 0 || saving === key} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 disabled:opacity-40">
                          <Save size={16} /> {saving === key ? "Menyimpan..." : changed > 0 ? `Simpan ${changed} Catatan` : "Tersimpan"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
