import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  username: null,
  email: null,
  firstName: null,
  lastName: null,
  role: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      console.log("Inside login dispatch");
      const { username, role, first_name, last_name, email } = action.payload;

      state.username = username;
      state.role = role;
      state.lastName = last_name;
      state.firstName = first_name;
      state.email = email;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    registerSuccess: (state, action) => {
      const { username, role, first_name, last_name, email } = action.payload;

      state.username = username;
      state.role = role;
      state.lastName = last_name;
      state.firstName = first_name;
      state.email = email;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    // eslint-disable-next-line no-unused-vars
    userLogout: (state) => {
      return { ...initialState };
    },
    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  loginSuccess,
  registerSuccess,
  userLogout,
  setIsLoading,
  setError,
} = authSlice.actions;

export const selectAuth = (state) => state.auth;

export default authSlice.reducer;
