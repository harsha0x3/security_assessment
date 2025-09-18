import { Outlet } from "react-router-dom";
import Checklists from "../pages/Checklists";

const ChecklistsLayout = () => {
  return (
    <div>
      <Checklists />
      <Outlet />
      {/* This is where nested routes will render */}
    </div>
  );
};
export default ChecklistsLayout;
