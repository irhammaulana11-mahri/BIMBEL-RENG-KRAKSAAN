import { Outlet } from "react-router-dom";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import UniversalSidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Backdrop from "./Backdrop";

function ParentContent() {
  const { isExpanded } = useSidebar();

  return (
    <>
      {/* Cukup kirimkan properti role="parent" */}
      <UniversalSidebar role="parent" />
      <Backdrop />
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${isExpanded ? "lg:ml-72" : "lg:ml-20"}`}>
        <Header />
        {/* Konten parent menggunakan latar belakang bersih slate-50 */}
        <main className="app-main flex-1 p-6 overflow-y-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </>
  );
}

export default function ParentLayout() {
  return (
    <SidebarProvider>
      <div className="app-shell min-h-screen bg-slate-50">
        <ParentContent />
      </div>
    </SidebarProvider>
  );
}