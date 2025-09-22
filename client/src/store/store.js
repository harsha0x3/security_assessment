import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/store/authSlice";
import { apiSlice } from "./apiSlice";
import applicationReducer from "../features/applications/store/applicationSlice";
import checklistReducer from "../features/checklists/store/checklistsSlice";
import filtersReducer from "./appSlices/filtersSlice";
const store = configureStore({
  reducer: {
    auth: authReducer,
    applications: applicationReducer,
    checklists: checklistReducer,
    filters: filtersReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: true,
});

export default store;
