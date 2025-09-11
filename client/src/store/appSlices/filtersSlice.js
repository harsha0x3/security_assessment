import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  appFilters: {
    searchTerm: "",
  },
  checklistFilters: {
    searchTerm: "",
  },
};

const filtersSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    setAppSearchTerm: (state, action) => {
      if (state.checklistFilters.searchTerm !== "") {
        state.checklistFilters.searchTerm = "";
      }
      state.appFilters.searchTerm = action.payload;
    },
    setChecklistSearchTerm: (state, action) => {
      state.checklistFilters.searchTerm = action.payload;
    },
    clearAppSearchTerm: (state, action) => {
      state.appFilters.searchTerm = "";
    },
    clearChecklistSearchTerm: (state, action) => {
      state.checklistFilters.searchTerm = "";
    },
  },
});
export const selectAppSearchTerm = (state) =>
  state.filters.appFilters.searchTerm;
export const selectChecklistSearchTerm = (state) =>
  state.filters.checklistFilters.searchTerm;
export const {
  setAppSearchTerm,
  setChecklistSearchTerm,
  clearAppSearchTerm,
  clearChecklistSearchTerm,
} = filtersSlice.actions;
export default filtersSlice.reducer;
