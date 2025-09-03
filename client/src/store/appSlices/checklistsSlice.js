import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentChecklist: {},
  allChecklists: [],
};

const checklistsSlice = createSlice({
  name: "checklists",
  initialState,
  reducers: {
    createChecklist: (state, action) => {
      const checklist = action.payload;
      const newChecklist = {
        checklistId: checklist.id,
        appName: checklist.app_nama,
        checklistType: checklist.checklist_type,
      };
      if (checklist.assigned_users) {
        newChecklist["assignedUsers"] = checklist.assigned_users;
      }

      state.allChecklists.push(newChecklist);
      state.currentChecklist = { ...newChecklist };
    },
    loadChecklists: (state, action) => {
      state.allChecklists = [];
      const allChecklists = action.payload;
      allChecklists.map((chk) => {
        const checklist = {
          checklistId: chk.id,
          appName: chk.app_nama,
          checklistType: chk.checklist_type,
        };
        if (chk.assigned_users) {
          checklist["assignedUsers"] = chk.assigned_users;
        }
        state.allChecklists.push(checklist);
      });
      state.currentChecklist = state.allChecklists[0] || {};
      if (state.allChecklists.length === 0) {
        state.currentChecklist = { ...initialState.currentChecklist };
      }
    },
    setCurrentChecklist: (state, action) => {
      if (action.payload) {
        console.log("ACRTION", action.payload);
        const checklistId = action.payload.checklistId;
        const index = state.allChecklists.findIndex(
          (chk) => chk.checklistId === checklistId
        );
        state.currentChecklist = state.allChecklists[index];
        return;
      }
      console.log(" NO ACRTION", action.payload);
      state.currentChecklist = { ...initialState.currentChecklist };
    },
  },
});

export const selectCurrentChecklist = (state) =>
  state.checklists.currentChecklist;
export const selectAllChecklists = (state) => state.checklists.allChecklists;
export const { createChecklist, loadChecklists, setCurrentChecklist } =
  checklistsSlice.actions;
export const getAssignedUsers = (state, action) => {
  const checklistId = action.payload;
  const checklist = state.checklists.allChecklists.find(
    (chk) => chk.checklistId === checklistId
  );

  if (checklist && checklist.assignedUsers) {
    return checklist.assignedUsers.map((user) => user.id);
  }
};
export default checklistsSlice.reducer;
