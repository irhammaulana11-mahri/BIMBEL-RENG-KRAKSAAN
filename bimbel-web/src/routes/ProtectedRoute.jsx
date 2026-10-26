import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

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
        showError("Anda tidak memiliki hak akses ke halaman tersebut.");

        return (<Navigate to={getHomeRoute(user)} replace/>);

    }

    return children;

}