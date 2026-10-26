import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

// Halaman awal sesuai role, dipakai saat user membuka halaman role lain
const HOME_BY_ROLE = {
    admin: "/admin/dashboard",
    super_admin: "/admin/dashboard",
    orang_tua: "/parent/dashboard",
    tentor: "/tentor/dashboard",
    siswa: "/student/dashboard",
};

const getHomeRoute = (user) => HOME_BY_ROLE[user?.role?.role_name] || "/";

export default function ProtectedRoute({children,allowedRoles = [],}) {
    const {user,loading,initialized,logout,hasRole,isAuthenticated,logoutReason,setLogoutReason} = useAuth();
    const location = useLocation();

    //  * Tunggu proses initialize AuthContext selesai
    if (!initialized || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Memuat sesi...</p>
            </div>
        );

    }

    //  * Belum login
    if (!isAuthenticated) {
        return (<Navigate to="/login" state={{reason:logoutReason}} replace/>);

    }

    //  * Role tidak sesuai
    if (allowedRoles.length && !hasRole(...allowedRoles)) {

        return (<Navigate to={getHomeRoute(user)} replace/>);

    }

    return children;

}