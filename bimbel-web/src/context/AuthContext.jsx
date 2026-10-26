import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser } from "../services/userService";
import { authStorage } from "../services/auth/authStorage";
import { registerLogout } from "../services/auth/authEvents";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);
    const [logoutReason, setLogoutReason] = useState(null);

    //  * Reset seluruh state Auth
    const resetAuthState = () => {setUser(null);};

    //  * Logout
    const logout = async () => {
        try {
            // Optional
            // await logoutApi();

        } catch (err) {
            console.warn("Logout API gagal", err);
        } finally {
            authStorage.clear();
            resetAuthState();
            setLogoutReason(reason);
        }
    };

    //  * Refresh Profile
    const refreshProfile = async () => {

        try {
            const res = await getCurrentUser();
            setUser(res.data);
            return res.data;
        } catch (err) {
            await logout();
            throw err;
        }
    };

    //  * Login
    const login = async (token) => {
        authStorage.setToken(token);
        authStorage.updateLastActivity();
        return await refreshProfile();
    };

    //  * Inisialisasi Session
    useEffect(() => {
        const initializeAuth = async () => {
            const token = authStorage.getToken();
            if (!token) {
                setLoading(false);
                setInitialized(true);
                return;
            }
            try {
                await refreshProfile();
            } finally {
                setLoading(false);
                setInitialized(true);
            }
        };
        initializeAuth();
    }, []);

    //  * Register Global Logout
    useEffect(() => {
        registerLogout(logout);
    }, []);

    //  * Helper Role
    const hasRole = (...roles) => {
        if (!user) return false;
        return roles.includes(user.role?.role_name);
    };

    return (

        <AuthContext.Provider value={{user,loading,initialized,login,logout,refreshProfile,hasRole,
                isAuthenticated: !!user,logoutReason,setLogoutReason,}}>
            {children}
        </AuthContext.Provider>

    );

}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }
  return context;
};