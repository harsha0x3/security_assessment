import { Outlet } from "react-router-dom";
import Checklists from "../components/Checklists";

// ChecklistsPage.jsx
const ChecklistsPage = () => {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Left side: Checklists */}
      <div className="">
        <Checklists />
      </div>

      {/* Right side: Controls (Outlet) */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default ChecklistsPage;
