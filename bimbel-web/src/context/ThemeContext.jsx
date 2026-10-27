import { createContext, useState, useContext, useEffect } from "react";

const ThemeContext = createContext();

const readSavedTheme = () => {
  try {
    return localStorage.getItem("theme") === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

export const ThemeProvider = ({ children }) => {
  // Baca tema tersimpan sejak render pertama agar tidak berkedip terang -> gelap
  const [theme, setTheme] = useState(readSavedTheme);
  // Jumlah halaman yang memaksa tema terang (landing page, login)
  const [forceLight, setForceLight] = useState(0);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Satu-satunya tempat kelas "dark" dipasang/dilepas
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark" && forceLight === 0);
  }, [theme, forceLight]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setForceLight }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Landing page & login selalu terang; tema pilihan berlaku lagi saat masuk dashboard
export const useForceLightTheme = () => {
  const { setForceLight } = useContext(ThemeContext);
  useEffect(() => {
    setForceLight((n) => n + 1);
    return () => setForceLight((n) => n - 1);
  }, [setForceLight]);
};

export const useTheme = () => {
  return useContext(ThemeContext);
};
