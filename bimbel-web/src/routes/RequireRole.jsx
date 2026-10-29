import { ShieldAlert } from "lucide-react";
import useAuth from "../hooks/useAuth";

/**
 * Halaman di dalam panel yang hanya boleh dibuka peran tertentu (mis. Backup: super_admin).
 * Server tetap menolak dengan 403; komponen ini hanya mencegah halaman kosong/berisi error.
 */
export default function RequireRole({ roles, children }) {
  const { hasRole } = useAuth();
  if (hasRole(...roles)) return children;

  return (
    <div className="max-w-lg mx-auto mt-16 p-6 bg-white rounded-2xl border border-gray-200 text-center space-y-2">
      <ShieldAlert size={32} className="mx-auto text-amber-600" />
      <h2 className="text-lg font-black text-gray-950">Anda tidak punya akses</h2>
      <p className="text-sm text-gray-500">Halaman ini hanya dapat dibuka oleh Super Admin.</p>
    </div>
  );
}
