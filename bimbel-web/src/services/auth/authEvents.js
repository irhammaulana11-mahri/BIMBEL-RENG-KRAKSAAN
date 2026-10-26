let logoutHandler = null;

export const registerLogout = (handler) => {
    logoutHandler = handler;
};

export const triggerLogout = (reason = "logout") => {
    if (logoutHandler) {
        logoutHandler(reason);
    }
};