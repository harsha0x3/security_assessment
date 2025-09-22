// RootLayout.jsx
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";
import { AppSidebar } from "./AppSidebar";

const RootLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 1024); // lg breakpoint

      if (width < 1024) {
        setIsSidebarCollapsed(true);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-10 bg-background border-b border-border flex items-center px-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 mr-3"
          onClick={handleToggleSidebar}
        >
          <PanelLeft className="h-4 w-4 text-foreground" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
        <div className="h-5 w-px bg-border mx-2" />
        <h1 className="text-lg font-semibold text-foreground">
          Security Assessments
        </h1>
        {/* <h1 className="text-lg font-semibold text-foreground pl-3 font-capitalize">
          <span>{" > "}</span>
          {location.pathname.split("/").filter(Boolean).at(-1) || "Home"}
        </h1> */}
      </header>

      {/* Main content area */}
      <div className="flex h-full pt-10">
        <AppSidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={handleToggleSidebar}
          isMobile={isMobile}
        />
        <main
          className={`flex-1 overflow-hidden transition-all duration-300
            ${!isMobile ? (isSidebarCollapsed ? "ml-16" : "ml-56") : "ml-16"}
          `}
        >
          <div className="h-full overflow-y-auto p-6 bg-background text-foreground">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default RootLayout;
