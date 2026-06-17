import { createContext,useContext,useState,useEffect,} from "react";

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error(
      "useSidebar must be used within a SidebarProvider"
    );
  }

  return context;
};



export function SidebarProvider({children,}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      if (
        window.innerWidth >= 1024
      ) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("resize",handleResize);

    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );
  }, []);

  const toggleSidebar = () => { setIsExpanded(prev => !prev); };
  const toggleMobileSidebar = () => { setIsMobileOpen(prev => !prev); };
  const toggleSubmenu = (item) => {setOpenSubmenu((prev) =>prev === item ? null : item);};

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        isMobileOpen,
        isHovered,
        activeItem,
        openSubmenu,
        toggleSidebar,
        toggleMobileSidebar,
        setIsHovered,
        setActiveItem,
        toggleSubmenu,
        
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}