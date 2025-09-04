import React from "react";
import RegisterForm from "../components/auth/RegisterForm";
import { useNavigate } from "react-router-dom";
const RegisterPage = () => {
  const navigate = useNavigate();
  const onSwitchToLogin = () => {
    navigate("/login");
  };

  const handleRegisterSuccess = () => {
    navigate("/applications", { replace: true });
  };
  return (
    <>
      <h1>Register</h1>
      <RegisterForm
        onSwitchToLogin={onSwitchToLogin}
        onClose={handleRegisterSuccess}
      />
    </>
  );
};

export default RegisterPage;
