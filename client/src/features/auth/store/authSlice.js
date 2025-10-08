import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  id: null,
  username: null,
  email: null,
  firstName: null,
  lastName: null,
  role: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  accessExp: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      const payload = action.payload;
      const user = payload.user || payload; // handle both {user:{..}} and flat {...}

      console.log("ACTION > PAYLOAD", payload);
      console.log("USER IN PAYLOAD", user);
      console.log("ACCESS EXP", payload.access_exp);
      const access_exp = state.accessExp;

      state.username = user.username;
      state.id = user.id;
      state.role = user.role;
      state.lastName = user.last_name;
      state.firstName = user.first_name;
      state.email = user.email;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      state.accessExp = payload.access_exp || access_exp;
    },
    registerSuccess: (state, action) => {
      const { username, role, first_name, last_name, email, id } =
        action.payload;

      state.username = username;
      state.role = role;
      state.id = id;
      state.lastName = last_name;
      state.firstName = first_name;
      state.email = email;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },

    updateUser: (state, action) => {
      const { username, role, first_name, last_name, email } = action.payload;
      state.username = username;
      state.role = role;
      state.lastName = last_name;
      state.firstName = first_name;
      state.email = email;
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
export const selectError = (state) => state.auth.error;
export const selectIsLoading = (state) => state.auth.isLoading;

export default authSlice.reducer;
