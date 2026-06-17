import { Outlet } from "react-router-dom";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";

import AdminSidebar from "../components/admin/Sidebar";
import AdminHeader from "../components/admin/Header";
import Backdrop from "./Backdrop";

function AdminContent() {
  const { isExpanded } = useSidebar();

  return (
    <>
      <AdminSidebar />
        <Backdrop />
          <div
            className={`flex flex-col min-h-screen transition-all duration-300
              ${
                isExpanded
                  ? "lg:ml-72"
                  : "lg:ml-20"
              }
            `}
          >
        <AdminHeader />

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