import { useState } from "react";
import { useSelector } from "react-redux";
import { selectAuth } from "../../auth/store/authSlice";
import { useUpdateUserProfileMutation } from "../../auth/store/authApiSlice";
import { User, Mail, Pencil, Check, X, Lock, Shield } from "lucide-react";

const Profile = ({ userDetails = null }) => {
  console.log("userDetails", userDetails);
  const currentUserStore = useSelector(selectAuth);
  const currentUser = userDetails || currentUserStore;
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    username: currentUser.username || "",
    first_name: currentUser.firstName || currentUser.first_name || "",
    last_name: currentUser.lastName || currentUser.last_name || "",
    email: currentUser.email || "",
    password: "",
    confirm_password: "",
    role: currentUser.role || "",
  });
  const [errorMsg, setErrorMsg] = useState("");

  const [updateUserProfile, { isLoading }] = useUpdateUserProfileMutation();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrorMsg(""); // clear errors while typing
  };

  const handleSubmit = async () => {
    if (form.password && form.password !== form.confirm_password) {
      setErrorMsg("Passwords do not match");
      return;
    }

    try {
      const payload = {
        username: currentUser.username !== form.username ? form.username : null,
        first_name:
          currentUser.firstName !== form.first_name ? form.first_name : null,
        last_name:
          currentUser.lastName !== form.last_name ? form.last_name : null,
        email: currentUser.email !== form.email ? form.email : null,
        password: currentUser.password !== form.password ? form.password : null,
        role: currentUser.role !== form.role ? form.role : null,
      };

      await updateUserProfile({
        payload,
        editingUserId: currentUser.id,
      }).unwrap();

      setEditMode(false);
      setForm({ ...form, password: "", confirm_password: "" }); // reset passwords
    } catch (err) {
      console.error("Failed to update user profile", err);
      setErrorMsg("Failed to update profile. Please try again.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg border border-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600" /> Profile
        </h1>

        {editMode ? (
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md flex items-center gap-1 disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> Save
            </button>
            <button
              onClick={() => {
                setEditMode(false);
                setForm({
                  ...form,
                  password: "",
                  confirm_password: "",
                  role: currentUser.role,
                });
                setErrorMsg("");
              }}
              className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded-md flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md flex items-center gap-1"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="space-y-4">
        {/* Username */}
        <div>
          <label className="text-gray-500 text-sm">Username</label>
          {editMode ? (
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-400"
            />
          ) : (
            <div className="text-lg font-medium">{currentUser.username}</div>
          )}
        </div>

        {/* Editable Fields */}
        <div>
          <label className="text-gray-500 text-sm">First Name</label>
          {editMode ? (
            <input
              type="text"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-400"
            />
          ) : (
            <div className="text-lg font-medium">
              {currentUser?.firstName || currentUser.first_name}
            </div>
          )}
        </div>

        <div>
          <label className="text-gray-500 text-sm">Last Name</label>
          {editMode ? (
            <input
              type="text"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-400"
            />
          ) : (
            <div className="text-lg font-medium">
              {currentUser?.lastName || currentUser?.last_name}
            </div>
          )}
        </div>

        <div>
          <label className="text-gray-500 text-sm flex items-center gap-1">
            <Mail className="w-4 h-4 text-gray-500" /> Email
          </label>
          {editMode ? (
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-400"
            />
          ) : (
            <div className="text-lg font-medium">{currentUser.email}</div>
          )}
        </div>

        {/* Password + Confirm Password */}
        {editMode && (
          <>
            <div>
              <label className="text-gray-500 text-sm flex items-center gap-1">
                <Lock className="w-4 h-4 text-gray-500" /> New Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Leave blank to keep current password"
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="text-gray-500 text-sm flex items-center gap-1">
                <Lock className="w-4 h-4 text-gray-500" /> Confirm Password
              </label>
              <input
                type="password"
                name="confirm_password"
                value={form.confirm_password}
                onChange={handleChange}
                placeholder="Re-enter password"
                className={`w-full p-2 border rounded-md focus:ring-2 ${
                  errorMsg
                    ? "border-red-500 focus:ring-red-400"
                    : "focus:ring-blue-400"
                }`}
              />
            </div>
          </>
        )}

        {/* Role - editable only if current user is admin */}
        <div>
          <label className="text-gray-500 text-sm flex items-center gap-1">
            <Shield className="w-4 h-4 text-gray-500" /> Role
          </label>
          {editMode && currentUser.role === "admin" ? (
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-400"
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          ) : (
            <div className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm">
              {currentUser.role}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
