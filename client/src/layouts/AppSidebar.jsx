// AppSidebar.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentApp } from "../features/applications/store/applicationSlice";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/themeContext/useTheme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutGrid,
  CheckSquare,
  Users,
  User,
  Trash,
  ClipboardCheck,
  ChevronRight,
  LayoutDashboard,
  Sun,
  Moon,
  Laptop,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { selectCurrentChecklist } from "@/features/checklists/store/checklistsSlice";

export function AppSidebar({ isCollapsed, onToggle, isMobile }) {
  const { logout, selectUser } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();
  const currentApp = useSelector(selectCurrentApp);
  const currentChecklist = useSelector(selectCurrentChecklist);
  const userInfo = selectUser();
  const searchParams = location.search;
  const { theme, setTheme } = useTheme();

  const navigationItems = [
    {
      name: "Applications",
      path: `/applications${searchParams}`,
      icon: LayoutGrid,
    },
    {
      name: "Checklists",
      path: `/${currentApp?.appId}/checklists/${currentChecklist?.checklistId}${searchParams}`,
      icon: CheckSquare,
    },
    ...(userInfo && userInfo.role === "admin"
      ? [{ name: "Add Users", path: `/addUsers${searchParams}`, icon: Users }]
      : []),
    { name: "Profile", path: `/profile${searchParams}`, icon: User },
    { name: "Trash", path: "/trash", icon: Trash },
    {
      name: "Pre Assessment",
      path: `/pre-assessment${searchParams}`,
      icon: ClipboardCheck,
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const isActiveRoute = (path) => {
    if (path === "/applications") {
      return location.pathname === "/" || location.pathname === "/applications";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <TooltipProvider>
      {/* Sidebar */}
      <div
        className={`transition-all duration-300 z-40
          ${isCollapsed ? "w-16" : "w-56"}
          fixed left-0 h-[calc(100vh-var(--header-height))] bg-sidebar border-r border-sidebar-border
        `}
      >
        {/* Navigation Items */}
        <nav className="p-2 space-y-1">
          {/* Other navigation items */}
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.path);

            return (
              <Tooltip key={item.path} delayDuration={200}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.path}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors group relative ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                    onClick={isMobile ? onToggle : undefined}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {!isCollapsed && (
                      <span className="ml-3 font-medium truncate">
                        {item.name}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">{item.name}</TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        {/* Bottom section (Profile + Current App) */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-4 space-y-4 bg-sidebar">
          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full flex items-center py-5 gap-2"
              >
                <div>
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {userInfo?.firstName?.[0] ||
                        userInfo?.username?.[0] ||
                        "U"}
                    </span>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="flex flex-col text-left flex-wrap truncate">
                    <span className="text-sm font-medium">
                      {userInfo?.username}
                    </span>
                    <span className="text-xs text-muted-foreground ">
                      {userInfo?.email}
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  Settings
                </DropdownMenuItem>
                {/* Theme switcher */}
                <DropdownMenuLabel className="flex flex-col items-start gap-2 hover:none">
                  <span className="text-xs font-medium text-muted-foreground">
                    Theme
                  </span>
                  <div className="flex justify-between items-center w-full">
                    {["light", "dark", "system"].map((t) => {
                      const isActive = theme === t;

                      const Icon =
                        t === "light" ? Sun : t === "dark" ? Moon : Laptop;

                      return (
                        <Button
                          key={t}
                          onClick={() => setTheme(t)}
                          variant={isActive ? "default" : "ghost"}
                        >
                          <Icon className="w-4 h-4" />
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </Button>
                      );
                    })}
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Current App Info */}
          {!isCollapsed && currentApp && (
            <div>
              <div className="text-xs text-sidebar-foreground/70 mb-1">
                Current App
              </div>
              <div className="text-sm font-medium text-sidebar-foreground truncate">
                {currentApp.name}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile/Tablet Overlay */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-foreground/50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
    </TooltipProvider>
  );
}
