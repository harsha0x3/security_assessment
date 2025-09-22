import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Card } from "../../../components/ui/Card";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Loader,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { selectIsLoading, selectError, setError } from "../store/authSlice";

const RegisterForm = ({ onSwitchToLogin, onClose }) => {
  const dispatch = useDispatch();
  // Form state
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    isEnableMfa: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);
  const [isEmailValid, setIsEmailValid] = useState(true);

  // Validate email format whenever it changes
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(emailRegex.test(formData.email));
  }, [formData.email]);

  //   const [acceptTerms, setAcceptTerms] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // Auth hook
  const { register } = useAuth();
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  // Clear errors when component mounts
  useEffect(() => {
    dispatch(setError(null));
  }, []);

  // Validate password strength
  useEffect(() => {
    const password = formData.password;
    setPasswordValidation({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password),
    });
  }, [formData.password]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      formData.username &&
      formData.email &&
      formData.password &&
      formData.confirmPassword &&
      formData.password === formData.confirmPassword &&
      Object.values(passwordValidation).every(Boolean) &&
      isEmailValid
    );
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid()) return;

    // Prepare registration data
    const registrationData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      first_name: formData.first_name || null,
      last_name: formData.last_name || null,
      enable_mfa: formData.isEnableMfa,
      role: formData.role || "user",
    };

    // Attempt registration
    const result = await register(registrationData);

    if (result.success) {
      setRegistrationResult(result.response);
      // onClose?.();
    }
  };

  // Password validation component
  const PasswordValidationIndicator = ({ isValid, text }) => (
    <div
      className={`flex items-center space-x-2 text-xs ${
        isValid ? "text-green-600" : "text-textMuted"
      }`}
    >
      {isValid ? (
        <CheckCircle className="w-3 h-3" />
      ) : (
        <XCircle className="w-3 h-3" />
      )}
      <span>{text}</span>
    </div>
  );

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-text mb-2">Create Account</h2>
        <p className="text-textMuted">Join us today</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              First Name
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="First name"
              className="w-full px-3 py-3 border border-border rounded-xl focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Last Name
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Last name"
              className="w-full px-3 py-3 border border-border rounded-xl focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors"
            />
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Username *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textMuted" />
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose username"
              className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Email *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/ 2text-blue-300 transform -translate-y-1/2 w-4 h-4 text-textMuted" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email"
              className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Password *
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textMuted" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create password"
              className="w-full pl-10 pr-12 py-3 border text-blue-300 border-border rounded-xl focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-textMuted hover:text-text transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Password Requirements */}
          {formData.password && (
            <div className="mt-2 space-y-1 p-3 bg-surface rounded-lg">
              <PasswordValidationIndicator
                isValid={passwordValidation.length}
                text="At least 8 characters"
              />
              <PasswordValidationIndicator
                isValid={passwordValidation.uppercase}
                text="One uppercase letter"
              />
              <PasswordValidationIndicator
                isValid={passwordValidation.lowercase}
                text="One lowercase letter"
              />
              <PasswordValidationIndicator
                isValid={passwordValidation.number}
                text="One number"
              />
              <PasswordValidationIndicator
                isValid={passwordValidation.special}
                text="One special character"
              />
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Confirm Password *
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textMuted" />
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-1 text-blue-300 focus:ring-accent/50 transition-colors ${
                formData.confirmPassword &&
                formData.password !== formData.confirmPassword
                  ? "border-red-300 focus:border-red-500"
                  : "border-border focus:border-accent"
              }`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-textMuted hover:text-text transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Password Match Indicator */}
          {formData.confirmPassword &&
            formData.password !== formData.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                Passwords do not match
              </p>
            )}
        </div>

        <div>
          <input
            type="checkbox"
            name="isEnableMfa"
            value={formData.isEnableMfa}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                isEnableMfa: e.target.checked,
              }))
            }
          />
          <label>Enable MFA</label>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Role *
          </label>
          <select
            name="role"
            value={formData.role || "user"}
            onChange={handleChange}
            className="w-full px-3 py-3 border border-border rounded-xl focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors"
            required
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {/* Terms and Conditions */}
        {/* <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="acceptTerms"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="w-4 h-4 text-accent border-border rounded focus:ring-accent/50 mt-1"
            required
          />
          <label htmlFor="acceptTerms" className="text-sm text-textMuted">
            I agree to the{" "}
            <button
              type="button"
              className="text-accent hover:text-accent/80 underline"
            >
              Terms of Service
            </button>{" "}
            and{" "}
            <button
              type="button"
              className="text-accent hover:text-accent/80 underline"
            >
              Privacy Policy
            </button>
          </label>
        </div> */}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={isLoading || !isFormValid()}
          icon={isLoading ? Loader : null}
          loading={isLoading}
        >
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>

      {registrationResult && registrationResult?.qr_code && (
        <div className="mt-4 text-center">
          <h3 className="font-bold">Scan this QR in Authenticator App</h3>
          <img
            src={registrationResult.qr_code}
            alt="MFA QR"
            className="mx-auto mt-2"
          />
          <h4 className="mt-4 font-semibold">Recovery Codes:</h4>
          <ul className="bg-gray-100 rounded p-3 text-sm">
            {registrationResult.recovery_codes.map((code, i) => (
              <li key={i}>{code}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Switch to Login */}
      {/* <div className="text-center mt-6">
        <p className="text-textMuted">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-accent hover:text-accent/80 font-medium transition-colors"
          >
            Sign in
          </button>
        </p>
      </div> */}
    </Card>
  );
};

export default RegisterForm;
