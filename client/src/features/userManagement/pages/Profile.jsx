import { useState } from "react";
import { useSelector } from "react-redux";
import { selectAuth } from "../../auth/store/authSlice";
import { useUpdateUserProfileMutation } from "../../auth/store/authApiSlice";
import {
  User,
  Mail,
  Pencil,
  Check,
  X,
  Lock,
  Shield,
  UserIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Profile = ({ userDetails = null }) => {
  console.log("userDetails", userDetails);
  const loggedInUser = useSelector(selectAuth);
  const currentUser = userDetails || loggedInUser;
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
    <Card className="max-w-3xl">
      <CardHeader className="flex flex-row justify-between items-center mb-0">
        <CardTitle className="text-xl flex">
          <UserIcon className="w-6 h-6 text-primary" /> Profile
        </CardTitle>
        {editMode ? (
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              isLoading={isLoading}
            >
              <Check className="w-4 h-4" /> Save
            </Button>
            <Button
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
              variant="destructive"
            >
              <X className="w-4 h-4" /> Cancel
            </Button>
          </div>
        ) : (
          <Button onClick={() => setEditMode(true)}>
            <Pencil className="w-4 h-4" /> Edit
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700 text-sm">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            {/* Username */}
            <div>
              <Label className=" text-sm">Username</Label>
              {editMode ? (
                <Input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-400"
                />
              ) : (
                <div className="text-lg font-medium">
                  {currentUser.username}
                </div>
              )}
            </div>

            {/* Editable Fields */}
            <div>
              <Label className=" text-sm">First Name</Label>
              {editMode ? (
                <Input
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
              <Label className=" text-sm">Last Name</Label>
              {editMode ? (
                <Input
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
              <Label className=" text-sm flex items-center gap-1">
                <Mail className="w-4 h-4 " /> Email
              </Label>
              {editMode ? (
                <Input
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
                  <Label className=" text-sm flex items-center gap-1">
                    <Lock className="w-4 h-4 " /> New Password
                  </Label>
                  <Input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Leave blank to keep current password"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <Label className=" text-sm flex items-center gap-1">
                    <Lock className="w-4 h-4 " /> Confirm Password
                  </Label>
                  <Input
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
              <Label className=" text-sm flex items-center gap-1">
                <Shield className="w-4 h-4 " /> Role
              </Label>
              {editMode && loggedInUser.role === "admin" ? (
                <Select
                  value={form.role || "user"}
                  onValueChange={(value) => setForm({ ...form, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="User Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm">
                  {currentUser.role}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Profile;
