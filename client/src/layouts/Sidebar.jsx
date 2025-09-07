// layouts/Sidebar.jsx
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentApp } from "../store/appSlices/applicationSlice";
import { selectAuth } from "../store/appSlices/authSlice";
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  Users,
  User,
  ChevronLeft,
  ChevronRight,
  Users2,
} from "lucide-react";

const Sidebar = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const currentApp = useSelector(selectCurrentApp);
  const userInfo = useSelector(selectAuth);

  const navigationItems = [
    {
      name: "Applications",
      path: "/applications",
      icon: FolderOpen,
    },

    {
      name: "Checklists",
      path: `/${currentApp.appId}/checklists`,
      icon: CheckSquare,
    },
    ...(userInfo && userInfo.role === "admin"
      ? [{ name: "Add Users", path: "/addUsers", icon: Users }]
      : []),

    {
      name: "Profile",
      path: "/profile",
      icon: User,
    },
  ];

  const isActiveRoute = (path) => {
    if (path === "/applications") {
      return location.pathname === "/" || location.pathname === "/applications";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-12 h-[calc(100vh-3rem)] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-40 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Navigation Items */}
        <nav className="p-2 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors group relative ${
                  isActive
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive
                      ? "text-blue-700 dark:text-blue-200"
                      : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200"
                  }`}
                />
                {!isCollapsed && (
                  <span className="ml-3 font-medium">{item.name}</span>
                )}
                {/* Active indicator for collapsed state */}
                {isCollapsed && isActive && (
                  <div className="absolute right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Current App Info (when not collapsed) */}
        {!isCollapsed && currentApp && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Current App
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {currentApp.name}
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default Sidebar;
