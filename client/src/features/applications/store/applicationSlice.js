import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentApp: {
    appId: "",
    name: "",
    description: "",
    platform: "",
    region: "",
    ownerName: "",
    providerName: "",
    infraHost: "",
    appTech: "",
    priority: null,
    department: "",
    isCompleted: false,
    isActive: null,
  },
  totalCount: null,
  apps: [],
};
const applicationSlice = createSlice({
  name: "applications",
  initialState,
  reducers: {
    addApp: (state, action) => {
      const {
        id,
        name,
        description,
        platform,
        region,
        owner_name,
        provider_name,
        infra_host,
        app_tech,
        is_completed,
        is_active,
        priority,
        department,
      } = action.payload;
      state.apps.push({
        appId: id,
        name,
        description,
        platform,
        region,
        ownerName: owner_name,
        providerName: provider_name,
        infraHost: infra_host,
        appTech: app_tech,
        isCompleted: is_completed,
        isActive: is_active,
        priority,
        department,
      });
      state.totalCount += 1;
    },

    removeApp: (state, action) => {
      const { id } = action.payload;
      state.totalCount -= 1;
      return state.apps.filter((app) => app.appId !== id);
    },

    updateApp: (state, action) => {
      const {
        id,
        name,
        description,
        platform,
        region,
        owner_name,
        provider_name,
        infra_host,
        app_tech,
        is_completed,
        is_active,
        priority,
        department,
      } = action.payload;
      const updatedData = {
        appId: id,
        name,
        description,
        platform,
        region,
        priority,
        department,
        ownerName: owner_name,
        providerName: provider_name,
        infraHost: infra_host,
        appTech: app_tech,
        isCompleted: is_completed,
        isActive: is_active,
      };
      const index = state.apps.findIndex((app) => app.appId === id);
      if (index !== -1) {
        state.apps[index] = { ...state.apps[index], ...updatedData };
      }
    },
    loadApps: (state, action) => {
      console.log("INSIDE LOAD APPS");
      state.apps = [];
      const data = action.payload;
      state.totalCount = data.total_count;
      data?.apps.map((app) => {
        const {
          id,
          name,
          description,
          platform,
          region,
          owner_name,
          provider_name,
          infra_host,
          app_tech,
          is_completed,
          is_active,
          priority,
          department,
        } = app;
        const formattedData = {
          appId: id,
          name,
          description,
          platform,
          region,
          ownerName: owner_name,
          providerName: provider_name,
          infraHost: infra_host,
          appTech: app_tech,
          isCompleted: is_completed,
          isActive: is_active,
          priority,
          department,
        };
        state.apps.push(formattedData);
      });
    },

    setCurrentApplication: (state, action) => {
      if (action.payload) {
        console.log("PAYLOAD IN SET CURRENT APP", action.payload);
        const { appId } = action.payload;
        const index = state.apps.findIndex((app) => app.appId === appId);
        state.currentApp = state.apps[index];
        return;
      }
      console.log("NO PAYLOAD IN SET CURRENT APP", action.payload);
      state.currentApp = { ...initialState.currentApp };
    },

    setCurrentApp: (state, action) => {
      if (action.payload) {
        console.log("PAYLOAD IN SET CURRENT APP", action.payload);
        const {
          id,
          name,
          description,
          platform,
          region,
          owner_name,
          provider_name,
          infra_host,
          app_tech,
          is_completed,
          is_active,
          priority,
          department,
        } = action.payload;

        const formattedData = {
          appId: id,
          name,
          description,
          platform,
          region,
          ownerName: owner_name,
          providerName: provider_name,
          infraHost: infra_host,
          appTech: app_tech,
          isCompleted: is_completed,
          isActive: is_active,
          priority,
          department,
        };

        state.currentApp = formattedData;
      }
    },
  },
});

export const loadAllApps = (state) => state.applications.apps;
export const selectCurrentApp = (state) => state.applications.currentApp;
export const {
  addApp,
  removeApp,
  updateApp,
  loadApps,
  setCurrentApplication,
  setCurrentApp,
} = applicationSlice.actions;

export default applicationSlice.reducer;
