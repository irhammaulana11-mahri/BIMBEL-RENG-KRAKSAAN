import React from "react";
import { NavLink } from "react-router-dom";
import { useSidebar } from "../../context/SidebarContext";

export default function SidebarMenu({ to, label, icon }) {
  const { isExpanded } = useSidebar();

  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
        ${isActive 
          ? "bg-blue-50 text-blue-600 font-bold shadow-xs" 
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-950"}
      `}
    >
      {/* Icon Wrapper */}
      <div className="shrink-0 flex items-center justify-center">
        {icon}
      </div>

      {/* Teks Label Hanya Tampil Jika Sidebar Melebar */}
      {isExpanded && (
        <span className="truncate tracking-wide animate-in fade-in duration-150">
          {label}
        </span>
      )}
    </NavLink>
  );
}