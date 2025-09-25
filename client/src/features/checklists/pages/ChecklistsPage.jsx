import { Outlet } from "react-router-dom";
import Checklists from "../components/Checklists";

const ChecklistsPage = () => {
  return (
    <div className="flex flex-col gap-1">
      <Checklists />
      <Outlet />
      {/* This is where nested routes will render */}
    </div>
  );
};
export default ChecklistsPage;
