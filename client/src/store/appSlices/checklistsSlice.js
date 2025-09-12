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
        appName: checklist.app_name,
        checklistType: checklist.checklist_type,
        isCompleted: checklist.is_completed || false,
        createdAt: checklist.created_at,
        updatedAt: checklist.updated_at,
        priority: checklist.priority,
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
          appName: chk.app_name,
          checklistType: chk.checklist_type,
          isCompleted: chk.is_completed || false,
          createdAt: chk.created_at,
          updatedAt: chk.updated_at,
          priority: chk.priority,
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
    updateChecklist: (state, action) => {
      const updated = action.payload;
      const index = state.allChecklists.findIndex(
        (chk) => chk.checklistId === updated.id
      );

      if (index !== -1) {
        // Build normalized checklist object
        const newChecklist = {
          checklistId: updated.id,
          appName: updated.app_name,
          checklistType: updated.checklist_type,
          isCompleted: updated.is_completed || false,
          createdAt: updated.created_at,
          updatedAt: updated.updated_at,
          priority: updated.priority,
        };

        if (updated.assigned_users) {
          newChecklist["assignedUsers"] = updated.assigned_users;
        }

        // Replace the checklist at the index
        state.allChecklists[index] = newChecklist;

        // If currentChecklist is this one, also update it
        if (state.currentChecklist?.checklistId === updated.id) {
          state.currentChecklist = { ...newChecklist };
        }
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
export const {
  createChecklist,
  loadChecklists,
  setCurrentChecklist,
  updateChecklist,
} = checklistsSlice.actions;
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
