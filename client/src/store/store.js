import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./appSlices/authSlice";
import { apiSlice } from "./apiSlices/apiSlice";
import applicationReducer from "./appSlices/applicationSlice";
import checklistReducer from "./appSlices/checklistsSlice";
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
