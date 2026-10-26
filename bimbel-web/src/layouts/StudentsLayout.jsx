import { Outlet } from "react-router-dom";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import UniversalSidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Backdrop from "./Backdrop";

function StudentContent() {
  const { isExpanded } = useSidebar();

  return (
    <>
      {/* Cukup kirimkan properti role="siswa" */}
      <UniversalSidebar role="siswa" />
      <Backdrop />
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${isExpanded ? "lg:ml-72" : "lg:ml-20"}`}>
        <Header />
        {/* Konten siswa menggunakan latar belakang bersih slate-50 */}
        <main className="flex-1 p-6 overflow-y-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </>
  );
}

export default function StudentLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-slate-50">
        <StudentContent />
      </div>
    </SidebarProvider>
  );
}