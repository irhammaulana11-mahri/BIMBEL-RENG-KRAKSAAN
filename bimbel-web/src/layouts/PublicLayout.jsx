import { Outlet } from "react-router-dom";
import Navbar from "../components/public/Navbar";
import Footer from "../components/public/Footer";
import { useForceLightTheme } from "../context/ThemeContext";

export default function PublicLayout() {
  useForceLightTheme();
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}