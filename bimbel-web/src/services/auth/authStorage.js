const AUTH_KEYS = [
    "token",
    "refreshToken",
    "lastActivity",
    "rememberMe",
    "user",
    "permissions",
    "menu",
];

export const authStorage = {
    getToken() {return localStorage.getItem("token");},
    setToken(token) {localStorage.setItem("token", token);},
    updateLastActivity() {localStorage.setItem("lastActivity", Date.now().toString());},
    clear() {AUTH_KEYS.forEach((key) => localStorage.removeItem(key));},
};