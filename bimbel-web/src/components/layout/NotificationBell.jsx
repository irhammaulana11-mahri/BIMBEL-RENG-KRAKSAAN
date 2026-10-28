import React, { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, UserCheck, UserX, Info } from "lucide-react";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/services/notificationService";

const KIND = {
  registration_approved: { icon: UserCheck, cls: "bg-emerald-50 text-emerald-600" },
  registration_rejected: { icon: UserX, cls: "bg-rose-50 text-rose-600" },
};

// Lonceng notifikasi di header semua role; diperbarui tiap 60 detik
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const load = () => getNotifications()
    .then((res) => { setItems(res.data.data || []); setUnread(res.data.unread || 0); })
    .catch(() => {});

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => { clearInterval(timer); document.removeEventListener("mousedown", close); };
  }, []);

  const read = async (n) => {
    if (n.read) return;
    const res = await markNotificationRead(n.id).catch(() => null);
    if (res) { setUnread(res.data.unread); setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))); }
  };

  const readAll = async () => {
    await markAllNotificationsRead().catch(() => {});
    setUnread(0);
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => { setOpen(!open); if (!open) load(); }} className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700" aria-label="Notifikasi">
        <Bell size={20} />
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(92vw,380px)] rounded-2xl border border-gray-200 bg-white shadow-2xl z-[999] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-black text-gray-900">Notifikasi</p>
            {unread > 0 && <button onClick={readAll} className="text-xs font-bold text-blue-600 flex items-center gap-1"><CheckCheck size={14} /> Tandai semua dibaca</button>}
          </div>
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-gray-50">
            {items.length === 0 && <p className="p-6 text-center text-sm text-gray-400">Belum ada notifikasi.</p>}
            {items.map((n) => {
              const k = KIND[n.kind] || { icon: Info, cls: "bg-blue-50 text-blue-600" };
              return (
                <div key={n.id} onClick={() => read(n)} className={`p-4 flex gap-3 cursor-pointer ${n.read ? "" : "bg-blue-50/40"}`}>
                  <div className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center ${k.cls}`}><k.icon size={18} /></div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${n.read ? "font-semibold text-gray-700" : "font-black text-gray-900"}`}>{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                    {Object.keys(n.details || {}).length > 0 && (
                      <div className="mt-2 rounded-lg bg-slate-50 border border-slate-100 p-2 space-y-0.5">
                        {Object.entries(n.details).map(([label, value]) => (
                          <p key={label} className="text-xs"><span className="text-gray-500">{label}:</span> <b className="font-mono text-gray-900 select-all break-all">{value}</b></p>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">{n.created_at}</p>
                  </div>
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
