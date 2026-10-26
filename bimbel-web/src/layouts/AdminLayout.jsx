import { Outlet } from "react-router-dom";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import UniversalSidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Backdrop from "./Backdrop";

function AdminContent() {
  const { isExpanded } = useSidebar();

  return (
    <>
      {/* Cukup kirimkan properti role="admin" */}
      <UniversalSidebar role="admin" />
      <Backdrop />
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${isExpanded ? "lg:ml-72" : "lg:ml-20"}`}>
        <Header />
        <main className="flex-1 p-6 overflow-y-auto bg-slate-100">
          <Outlet />
        </main>
      </div>
    </>
  );
}

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-slate-100">
        <AdminContent />
      </div>
    </SidebarProvider>
  );
}