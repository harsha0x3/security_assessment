import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { useAuth } from "../../hooks/useAuth";
import Button from "../ui/Button";
import { Card } from "../ui/Card";
import { Eye, EyeOff, Mail, Lock, Loader } from "lucide-react";

import { selectAuth, setError } from "../../store/appSlices/authSlice";

const LoginForm = ({ onSwitchToRegister, onClose }) => {
  const [formData, setFormData] = useState({
    email_or_username: "",
    password: "",
    mfa_code: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const auth = useSelector(selectAuth);
  const isLoading = auth.isLoading;
  const error = auth.error;
  const { login } = useAuth();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setError(null));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email_or_username || !formData.password) {
      return;
    }

    const result = await login(formData);

    if (result.success) {
      onClose?.();
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-text mb-2">Welcome Back</h2>
        <p className="text-textMuted">Sign in to your account</p>
      </div>

      {/* Error Display */}
      {auth.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username/Email Input */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Email or Username
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textMuted" />
            <input
              type="text"
              name="email_or_username"
              value={formData.email_or_username}
              onChange={handleChange}
              placeholder="Enter email or username"
              className="w-full pl-10 pr-4 py-3 text-blue-300 border border-border rounded-xl focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors"
              required
            />
          </div>
        </div>
        {/* Password Input */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textMuted" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              className="w-full pl-10 pr-12 py-3 border text-blue-300 border-border rounded-xl focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors"
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-textMuted hover:text-text transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            MFA Code
          </label>
          <input
            type="text"
            name="mfa_code"
            value={formData.mfa_code}
            onChange={handleChange}
            placeholder="Enter MFA code (if enabled)"
            className="w-full pl-10 pr-12 py-3 border text-black border-border rounded-xl focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors"
          />
        </div>
        <div>
          <button
            type="button"
            className="text-sm text-accent hover:text-accent/80 transition-colors"
          >
            Forgot password?
          </button>
        </div>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={
            isLoading || !formData.email_or_username || !formData.password
          }
          icon={isLoading ? Loader : null}
          loading={isLoading}
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </Button>
      </form>

      {/* Switch to Register */}
      {/* <div className="text-center mt-6">
        <p className="text-textMuted">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-accent hover:text-accent/80 font-medium transition-colors"
          >
            Sign up
          </button>
        </p>
      </div> */}
    </Card>
  );
};

export default LoginForm;
