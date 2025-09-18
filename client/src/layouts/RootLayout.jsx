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
    <div className="h-screen overflow-hidden bg-background">
      <Header
        onToggleSidebar={handleToggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      <div className="flex h-full pt-8">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={handleToggleSidebar}
        />
        <main
          className={`flex-1 overflow-hidden transition-all duration-300 ${
            isSidebarCollapsed ? "ml-12" : "ml-52"
          }`}
        >
          <div className="h-full overflow-y-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default RootLayout;
