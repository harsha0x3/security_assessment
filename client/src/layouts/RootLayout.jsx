// Updated RootLayout with sidebar integration
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

const RootLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onToggleSidebar={handleToggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={handleToggleSidebar}
      />
      <div className="flex">
        <main
          className={`flex-1 pt-16 p-6 transition-all duration-300 ${
            isSidebarCollapsed ? "ml-16" : "ml-56"
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default RootLayout;
