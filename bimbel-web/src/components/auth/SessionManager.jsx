import { useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import { authStorage } from "../../services/auth/authStorage";
import { triggerLogout } from "../../services/auth/authEvents";

export default function SessionManager({ children }) {
    const { isAuthenticated } = useAuth();
    const TIMEOUT = 10 * 60 * 1000;
    useEffect(() => {
        if (!isAuthenticated) return;
        const updateActivity = () => {
            authStorage.updateLastActivity();
        };

        const checkTimeout = () => {
            const lastActivity = Number(
                localStorage.getItem("lastActivity")
            );

            if (!lastActivity) return;

            const idleTime = Date.now() - lastActivity;

            if (idleTime >= TIMEOUT) {
                triggerLogout("idle");
                triggerLogout();
            }

        };

        const interval = setInterval(checkTimeout,5000);
        const events = ["mousemove","mousedown","keypress","touchstart","scroll",];
        updateActivity();

        events.forEach(event => {
            window.addEventListener(
                event,
                updateActivity
            );
        });

        return () => {
            clearInterval(interval);
            events.forEach(event => {
                window.removeEventListener(
                    event,
                    updateActivity
                );

            });
        };

    }, [isAuthenticated]);
    return children;

}