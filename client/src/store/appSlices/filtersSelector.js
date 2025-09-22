import { createSelector } from "@reduxjs/toolkit";
import { selectAppSearchTerm, selectChecklistSearchTerm } from "./filtersSlice";
import {
  loadAllApps,
  selectCurrentApp,
} from "../../features/applications/store/applicationSlice";
import { selectAllChecklists } from "../../features/checklists/store/checklistsSlice";

export const selectFilterdApps = createSelector(
  [loadAllApps, selectAppSearchTerm],
  (apps, query) => {
    if (!query) return apps;
    const q = query.toLowerCase();
    console.log("apps in selector", apps);
    return apps.filter((app) => app.name.toLowerCase().includes(q));
  }
);

export const selectFilteredChecklists = createSelector(
  [selectAllChecklists, selectChecklistSearchTerm],
  (checklists, query) => {
    if (!checklists) return;
    if (!query) return checklists;
    const q = query.toLowerCase();
    return checklists.filter((chk) =>
      chk.checklistType.toLowerCase().includes(q)
    );
  }
);
