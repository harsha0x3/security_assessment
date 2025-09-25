import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { useAuth } from "../hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/Card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader } from "lucide-react";

import { REGEXP_ONLY_DIGITS } from "input-otp";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { selectAuth, setError } from "../store/authSlice";

const LoginForm = ({ onClose }) => {
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
    console.log("FORM DATA", formData);

    if (result.success) {
      onClose?.();
    }
  };

  return (
    <Card className="w-full mx-auto p-3">
      {/* Header */}
      <CardHeader>
        <CardTitle className="text-center font-bold text-xl">
          Login to your Account
        </CardTitle>
        <CardDescription className="text-center">
          Enter your email or username and password below to login.
        </CardDescription>
      </CardHeader>

      {/* Error Display */}
      {auth.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}
      {/* Form */}
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username/Email Input */}
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label>Email or Username</Label>
              <div className="flex relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textMuted" />
                <Input
                  type="text"
                  name="email_or_username"
                  value={formData.email_or_username}
                  onChange={handleChange}
                  placeholder="Enter email or username"
                  className="w-full pl-10 pr-12 py-3 border"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Password</Label>
              <div className="flex relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textMuted" />
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-12 py-3 border"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mfa_code">MFA Code</Label>
              <InputOTP
                id="mfa_code"
                maxLength={6}
                pattern={REGEXP_ONLY_DIGITS}
                value={formData.mfa_code}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, mfa_code: val }))
                }
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSeparator />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              size="lg"
              className=""
              disabled={
                isLoading || !formData.email_or_username || !formData.password
              }
              icon={isLoading ? Loader : null}
              loading={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </div>
        </form>
      </CardContent>

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
