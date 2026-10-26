import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="
        flex items-center justify-center
        w-10 h-10
        rounded-full
        border
        hover:bg-gray-100
      "
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}