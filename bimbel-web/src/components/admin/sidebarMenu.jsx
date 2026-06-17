import { NavLink } from "react-router-dom";
import { useSidebar } from "../../context/SidebarContext";

export default function SidebarMenu({icon,label,to,}) {
  const { isExpanded } = useSidebar();

  return (
    <NavLink to={to} className={({ isActive }) => 
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all
          ${isActive ? "bg-blue-50 text-blue-600" : "hover:bg-slate-100"}
          ${!isExpanded && "justify-center"}
        `}>
      {icon}
      {isExpanded && (
        <span>{label}</span>
      )}
    </NavLink>
  );
}